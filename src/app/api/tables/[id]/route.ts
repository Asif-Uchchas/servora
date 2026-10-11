import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { tableSchema } from "@/lib/validations";

async function findOwned(id: string, restaurantId: string) {
    const table = await db.diningTable.findFirst({ where: { id, restaurantId } });
    if (!table) throw new ApiError(404, "Table not found");
    return table;
}

// Any staff member can change a table's status (e.g. mark it as cleaned); only managers edit its setup.
export const PATCH = withAuth(async (req, { restaurantId, role, params }) => {
    await findOwned(params.id, restaurantId);
    const input = await parseBody(req, tableSchema.partial());
    const editsSetup = input.label !== undefined || input.capacity !== undefined || input.area !== undefined;
    if (editsSetup && role === "STAFF") throw new ApiError(403, "Only managers can edit table setup");

    const table = await db.diningTable.update({ where: { id: params.id }, data: input });
    return json(table);
});

export const DELETE = withAuth(
    async (_req, { restaurantId, params }) => {
        await findOwned(params.id, restaurantId);
        await db.diningTable.delete({ where: { id: params.id } });
        return json({ success: true });
    },
    { roles: ["ADMIN", "MANAGER"] }
);
