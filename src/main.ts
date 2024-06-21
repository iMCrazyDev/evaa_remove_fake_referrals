import {pgConfig} from "./configs";
import {Pool} from "pg";
import {convertAddress, iterateOverSupabaseUsers, iterateOverUsers, MyDatabase} from "./hepler";
import {promises as fs} from 'fs';

type WalletCreation = {
    [key: string]: Date;
};

async function main() {
    let dict: WalletCreation = {};
    const db = new MyDatabase(new Pool(pgConfig));

    console.log("Reading postgresql users...")
    const fillDict = function (x: any) {
        const addr = convertAddress(x.wallet_address);
        dict[addr] = new Date(x.created_at);
    };
    await iterateOverUsers(db, fillDict);

    console.log("Iterate over supabase referrals...")

    let badAccs: any[] = [];
    let total: number = 0;
    const iter = function (supabaseLine: any) {
        total ++;
        let addr = "";
        try {
            addr = convertAddress(supabaseLine.referral_address);
        } catch (err) { 
            badAccs.push({"reason": "bad_addr", "line": supabaseLine});
            return;
        }

        const referralCreated: Date = new Date(supabaseLine.created_at);
        
        if (!(addr in dict))  {
            badAccs.push({"reason": `addr_not_found_postgres ${addr}`, "line": supabaseLine});
            return;
            // deleteByWalletAddress addr todo 
        }
        if (referralCreated > dict[addr]) {
            badAccs.push({"reason": `deploy date, postgres: ${dict[addr]}`, "line": supabaseLine});
            // deleteByWalletAddress addr todo
        }
    };

    await iterateOverSupabaseUsers(iter);
    await fs.writeFile('res.txt', JSON.stringify(badAccs));
    //wallet_address
    console.log(total);
}

main();
