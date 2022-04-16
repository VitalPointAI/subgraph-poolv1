import { near, log, json, JSONValueKind, BigInt } from "@graphprotocol/graph-ts";
import { StakingPool } from "../generated/schema";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const actions = receipt.receipt.actions;
  
  for (let i = 0; i < actions.length; i++) {
    handleAction(
      actions[i], 
      receipt.receipt, 
      receipt.block.header,
      receipt.outcome,
      receipt.receipt.signerPublicKey
      );
  }
}

function handleAction(
  action: near.ActionValue,
  receipt: near.ActionReceipt,
  blockHeader: near.BlockHeader,
  outcome: near.ExecutionOutcome,
  publicKey: near.PublicKey
): void {
  
  if (action.kind != near.ActionKind.FUNCTION_CALL) {
    log.info("Early return: {}", ["Not a function call"]);
    return;
  } 
  
  const functionCall = action.toFunctionCall();

  if (functionCall.methodName == "on_staking_pool_create") {
    const receiptId = receipt.id.toBase58()
    let logs = new StakingPool(`${receiptId}`)

    // Standard receipt properties
    logs.blockTime = BigInt.fromU64(blockHeader.timestampNanosec/1000000)
    logs.blockHeight = BigInt.fromU64(blockHeader.height)
    logs.blockHash = blockHeader.hash.toBase58()
    logs.predecessorId = receipt.predecessorId
    logs.receiverId = receipt.receiverId
    logs.signerId = receipt.signerId
    logs.signerPublicKey = publicKey.bytes.toBase58()
    logs.gasBurned = BigInt.fromU64(outcome.gasBurnt)
    logs.tokensBurned = outcome.tokensBurnt
    logs.outcomeId = outcome.id.toBase58()
    logs.executorId = outcome.executorId
    logs.outcomeBlockHash = outcome.blockHash.toBase58()

    // Log Parsing
    if(outcome.logs !=null && outcome.logs.length > 0){
      
        log.info("outcome log is: {}", [outcome.logs[0]])
        let firstLog = outcome.logs[0]

        let firstParts = firstLog.split(' ')
        logs.stakingPool = firstParts[3].substr(1)
 
        logs.save()
    }
  
  } else {
    log.info("Not processed - FunctionCall is: {}", [functionCall.methodName]);
  }

}
