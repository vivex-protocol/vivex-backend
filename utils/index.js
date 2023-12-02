const fs = require('fs');
const Web3 = require("web3")
const ethereumUtil = require("ethereumjs-util")
const fetch = require("cross-fetch")
const getStream = require('get-stream');
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { parse } = require('csv-parse');
const config = require("../config/config")

const web3 = new Web3(config.rpcUrl)
const WETHADDR = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

module.exports.readCSVData = async (filePath) => {
    const parseStream = parse({ delimiter: ',' });
    const data = await getStream.array(fs.createReadStream(filePath).pipe(parseStream));
    return data
}

module.exports.getRecoverAddress = (plainData, signData) => {

    plainData = web3.utils.keccak256(plainData)
    const messageHash = ethereumUtil.hashPersonalMessage(
        ethereumUtil.toBuffer(web3.utils.toHex(plainData))
    );
    const signatureBuffer = ethereumUtil.toBuffer(signData);
    const signatureParams = ethereumUtil.fromRpcSig(signatureBuffer);
    const publicKey = ethereumUtil.ecrecover(
        messageHash,
        signatureParams.v,
        signatureParams.r,
        signatureParams.s
    );
    const recoveredAddress = ethereumUtil.pubToAddress(publicKey).toString("hex");
    return `0x${recoveredAddress}`;
};

module.exports.getAccountAge = async (address) => {
    // try {
    //     const resp = await fetch(`${config.apiUrl}${config.apiKey}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=asc&apikey=${config.apiKey}`)
    //     if (resp.status === 200) {
    //         const data = await resp.json()
    //         if (data['result'] && data['result'].length > 0) {
    //             const period = (Date.now() / 1000 - Number(data['result'][0]['timestamp'])) / 86400
    //             return period
    //         }
    //         return 0
    //     }
    //     return -1
    // } catch (e) {
    //     console.log(e)
    //     return -1
    // }

    try {
        await Moralis.start({
            apiKey: config.moralisKey,
        });
    } catch (e) {
        console.log()
    }

    const chains = [EvmChain.ETHEREUM];

    const response = await Moralis.EvmApi.wallets.getWalletActiveChains({
        address,
        chains,
    });

    try {
        const first = response.toJSON()['active_chains'][0]['first_transaction']
        if (first === null || first === undefined) return [0, 0]
        const firstDate = new Date(first['block_timestamp'])
        const yearsDiff = new Date().getFullYear() - firstDate.getFullYear()
        const monthsDiff = new Date().getMonth() - firstDate.getMonth();
        return [parseInt((Date.now() - new Date(first['block_timestamp']).getTime()) / 86400000), yearsDiff * 12 + monthsDiff]
    } catch (e) {
        console.log(e)
        return [0, 0]
    }
}

module.exports.getAssetList = async (address) => {
    try {
        await Moralis.start({
            apiKey: config.moralisKey,
        });
    } catch (e) {
        console.log()
    }

    const chain = EvmChain.ETHEREUM;

    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain,
    });

    return response.toJSON()
}

module.exports.getNativeBalance = async (address) => {
    try {
        await Moralis.start({
            apiKey: config.moralisKey,
        });
    } catch (e) {
        console.log()
    }

    const chain = EvmChain.ETHEREUM;

    const response = await Moralis.EvmApi.balance.getNativeBalance({
        address,
        chain,
    });

    return response.toJSON()
}

module.exports.getTokenPrice = async (tokenAddress) => {
    try {
        await Moralis.start({
            apiKey: config.moralisKey,
        });
    } catch (e) {
        console.log()
    }

    const response = await Moralis.EvmApi.token.getTokenPrice({
        address: tokenAddress,
        chain: EvmChain.ETHEREUM,
    });

    return response.toJSON()
}

module.exports.getNativeUsdBalance = async (address) => {
    const balanceObj = this.getNativeBalance(address)
    const priceObj = this.getTokenPrice(WETHADDR)
    return parseFloat(priceObj.usdPrice) * (Number(balanceObj.balance) / 1000000000000000000)
}

module.exports.getUsdBalance = async (address) => {
    const tokenList = await this.getAssetList(address)
    let usdBalance = 0
    for (let t of tokenList) {
        const priceObj = this.getTokenPrice(t.token_address)
        usdBalance += parseFloat(priceObj.usdPrice) * (Number(t.balance) / Math.pow(10, Number(t.decimals)))
    }
    usdBalance += this.getNativeUsdBalance(address)

    return usdBalance
}

module.exports.getTransactionAmountInMonth = async (tokenAddress) => {
    try {
        await Moralis.start({
            apiKey: config.moralisKey,
        });
    } catch (e) {
        console.log()
    }

    const response = await Moralis.EvmApi.transaction.getWalletTransactions({
        address: tokenAddress,
        chain: EvmChain.ETHEREUM,
        fromDate: Date.now() - 86400000 * 30,
        toDate: Date.now()
    });

    return response.toJSON()['result'].length
}

module.exports.getSignedData = async (_point, _url) => {
    try {
        let pointToString = _point.toString(16).padStart(16, '0');
        const hash = await web3.utils.soliditySha3(Buffer.from(_url));
        var sigHash = await web3.utils.soliditySha3(hash + pointToString);
        // const sigHash = await web3.utils.soliditySha3(hash + campaignIdString);
        // const signedMsg = await web3.eth.accounts.sign(sigHash, process.env.prkey)
        const signedMsg = await web3.eth.accounts.sign(sigHash, config.signPvkey)
        return signedMsg.signature
    } catch (e) {
        console.log ("getSignedData ===> ", e)
        return 'signed failed'
    }
}

module.exports.isEmpty = (data) => {
    return data.trim().length > 0
}