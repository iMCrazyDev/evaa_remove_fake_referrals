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
        let referral_address = "";
        let user_address = "";
        try {
            referral_address = convertAddress(supabaseLine.referral_address);
            user_address = convertAddress(supabaseLine.user_address);
        } catch (err) { 
            badAccs.push({"reason": "bad_addr", "line": supabaseLine});
            return;
        }
        // console.log(supabaseLine);
        const referralCreated: Date = new Date(supabaseLine.created_at);
        
        if (!(referral_address in dict))  {
            // badAccs.push({"reason": `addr_not_found_postgres ${referral_address}`, "line": supabaseLine});
            return;
            // deleteByWalletAddress addr todo 
        }
        if (!(user_address in dict))  {
            
            // badAccs.push({"reason": `addr_not_found_postgres ${user_address}`, "line": supabaseLine});
            return;
            // deleteByWalletAddress addr todo 
        }
        const dateDiff = referralCreated.getTime() - dict[user_address].getTime();
        if (dateDiff / 1000 > 3600) {  // 1000 
            badAccs.push({"reason": `deploy date, postgres: ${dict[user_address].toUTCString()}`, "line": supabaseLine});
            // deleteByWalletAddress addr todo
        }
    };

    await iterateOverSupabaseUsers(iter);
    await fs.writeFile('res.txt', JSON.stringify(badAccs));
    //wallet_address
    console.log(total);
}

main();
