import {createClient} from "@supabase/supabase-js";
import {Address} from "@ton/ton";
import {supabaseConfig} from "./configs";
import {Pool} from "pg";

export const supabase = createClient(supabaseConfig.url as string, supabaseConfig.key as string);
const GET_USERS_PAGE_SIZE = 1000;

export function convertAddress(address: string): string {
    return Address.parse(address).toString({
        bounceable: true,
        testOnly: false,
    });
}

export async function deleteByWalletAddress(walletAddress: string): Promise<void> {
    try {
        const { data, error } = await supabase
            .from("users")
            .delete()
            .eq("wallet_address", walletAddress);

        if (error) {
            throw error;
        }

        console.log("Records deleted:", data);
    } catch (err) {
        console.error("Error deleting records:", err);
    }
}

export async function iterateOverSupabaseUsers(lambda: any) {
    let page = 0;
    let users = [];
    let promises = [];
    do {
        const { data, error } = await supabase
            .from("users")
            .select()
            .range(page * GET_USERS_PAGE_SIZE, (page + 1) * GET_USERS_PAGE_SIZE - 1);

        if (error) {
            throw error;
        }

        users = data;
        promises.push(users.map((user: any) => lambda(user)));
        page++;
    } while (users.length === GET_USERS_PAGE_SIZE);

    await Promise.all(promises);
}

export async function iterateOverUsers(db: MyDatabase, lambda: any) {  // todo
    let page = 0;
    let users = [];
    let promises = [];
    do {
        users = await db.getUsersPage(page)
        promises.push(users.map((item: any) => lambda(item)));
        page++;
    } while (users.length === GET_USERS_PAGE_SIZE)
    await Promise.all(promises);
}

export class MyDatabase {
    private pool: Pool;

    constructor(pool: Pool ) {
        this.pool = pool;
    }

    async getUsersPage (page: number) {
        const from = page * GET_USERS_PAGE_SIZE;
        
        try {
            const result = await this.pool.query({
                text: `SELECT * FROM ${process.env.USERS_TABLE} OFFSET $1 LIMIT $2`,
                values: [from, GET_USERS_PAGE_SIZE],
            });
            return result.rows;
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

}

