const fetch = require ('cross-fetch')

module.exports.getPrices = async ({instrument, period, from, nRows, v2}) => {
    const resp = await fetch(`https://prices.contango.xyz?instrument=${instrument}&period=${period}&from=${from}&nRows=${nRows}&v2=${v2}`)
    console.log (resp.status, "<<<<<")
    if (resp.status === 200) {
        const jsonData = await resp.json()
        return jsonData
    }
    return {}
}
