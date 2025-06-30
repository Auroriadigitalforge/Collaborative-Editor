import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DataModel, Id } from "./_generated/dataModel";
import { GenericQueryCtx, GenericMutationCtx } from "convex/server";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

async function checkPermissions(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  id: string
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const document = await ctx.db.get(id as Id<"documents">);
  if (!document) {
    throw new Error("Document not found");
  }

  // Check if user can access this document
  if (!document.isPublic && document.createdBy !== userId) {
    throw new Error("Access denied");
  }
}

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi<DataModel>({
  checkRead: checkPermissions,
  checkWrite: checkPermissions,
  onSnapshot: async (ctx, id, snapshot, version) => {
    // Update the document's updatedAt timestamp when content changes
    await ctx.db.patch(id as Id<"documents">, {
      updatedAt: Date.now(),
    });
  },
});
