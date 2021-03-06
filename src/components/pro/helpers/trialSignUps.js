import axios from "axios";
import { makeECPrivateKey, getPublicKeyFromPrivate } from 'blockstack/lib/keys';
import { ToastsStore} from 'react-toasts';
import { setGlobal, getGlobal } from 'reactn';
import { postData } from '../../shared/helpers/post';
const blockstack = require('blockstack');
const uuid = require("uuidv4");

export async function startTrial() {
    const { userSession } = getGlobal();
    const privateKey = makeECPrivateKey();
    const publicKey = getPublicKeyFromPrivate(privateKey);
    const name = document.getElementById('trial-name').value;
    const organization = document.getElementById('trial-org').value;
    const email = document.getElementById('trial-email').value;
    const trialObject = {
        orgId: uuid(),
        userId: uuid(),
        name,
        organization,
        email,
        blockstackId: getGlobal().userSession.loadUserData().username,
        pubKey: blockstack.getPublicKeyFromPrivate(userSession.loadUserData().appPrivateKey),
        teamPubKey: publicKey
    }

    let trialParams = {
        fileName: "account.json",
        encrypt: true,
        body: JSON.stringify(trialObject)
    }

    let postTrial = await postData(trialParams);
    console.log(postTrial);

    const data = {
        profile: userSession.loadUserData().profile,
        username: userSession.loadUserData().username,
        pubKey: getPublicKeyFromPrivate(privateKey)
    }
    const bearer = blockstack.signProfileToken(data, userSession.loadUserData().appPrivateKey);

    const headerObj = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            'Authorization': bearer
        },
    }
    axios.post(`/account/org`, JSON.stringify(trialObject), headerObj)
        .then(async (res) => {
            console.log(res.data)
            if(res.data.success === false) {
                ToastsStore.error(res.data.message);
            } else {
                document.getElementById('trial-name').value = "";
                document.getElementById('trial-org').value = "";
                document.getElementById('trial-email').email = "";
                setGlobal({ trialModalOpen: false })
                //Now we need to save the team public key to Gaia.

                const teamKeyParams = {
                    fileName: `admins/key/${privateKey}`,
                    encrypt: true,
                    body: JSON.stringify(privateKey)
                }
                const postedKey = await postData(teamKeyParams);
                console.log(postedKey);

                setGlobal({ welcome: true, graphitePro: true });
            }
        }).catch((error) => {
            console.log(error)
            ToastsStore.error(`Trouble submitting trial account info`);
        })
}
