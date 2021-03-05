'use strict'

const debug = require('debug')('merkle-box')

const abi = require('./abi.json')
const addresses = require('./addresses')

const createMerkleBox = function (web3, address, options) {
  const { from, gasFactor } = options

  debug('Creating a MerkleBox at %s for %s', address, from || 'read-only')

  const merkleBox = new web3.eth.Contract(abi, address)

  const safeGas = (gas) => Math.ceil(gas * gasFactor)

  const estimateGasAndSend = (method, transactionOptions) =>
    Promise.resolve(
      transactionOptions.gas || method.estimateGas().then(safeGas)
    ).then((gas) => method.send({ gas, ...transactionOptions }))

  const getHolding = function (claimGroupId) {
    return merkleBox.methods.holdings(claimGroupId).call()
  }

  const isClaimable = function (claimGroupId, account, amount, proof) {
    return merkleBox.methods
      .isClaimable(claimGroupId, account, amount, proof)
      .call()
  }

  const newClaimsGroup = function (erc20, amount, root, unlock, memo, txOps) {
    return estimateGasAndSend(
      merkleBox.methods.newClaimsGroup(erc20, amount, root, unlock, memo),
      { from, ...txOps }
    )
  }

  const claim = function (claimGroupId, account, amount, proof, txOps) {
    return estimateGasAndSend(
      merkleBox.methods.claim(claimGroupId, account, amount, proof),
      { from, ...txOps }
    )
  }

  return {
    getHolding,
    isClaimable,
    newClaimsGroup,
    claim
  }
}

createMerkleBox.addresses = addresses

module.exports = createMerkleBox
