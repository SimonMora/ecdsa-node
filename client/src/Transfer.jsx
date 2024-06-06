import { useState } from "react";
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { sha256 } from "ethereum-cryptography/sha256";
import { utf8ToBytes} from "ethereum-cryptography/utils";

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  
  const [canSubmit, setCanSubmit] = useState(true);
  const [signedTransaction, setSignedTransaction] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();
    console.log(signedTransaction);

    try {
      const {
        data: { balance }
      } = await server.post(`send`,
        {
          sender: address,
          amount: parseInt(sendAmount),
          recipient,
          sign: JSON.stringify(signedTransaction, (_, v) => typeof v === 'bigint' ? v.toString() : v),
        }
      );
      setBalance(balance);
      setSendAmount("");
      setRecipient("");
      setPrivateKey("");
      setCanSubmit(true);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  function showModal() {
    const modal = document.getElementById("signModal");
    modal.style.display = "block";
  }

  function closeModal() {
    const modal = document.getElementById("signModal");
    modal.style.display = "none";
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === 'Escape')
      closeModal();
  });

  function signTransaction(evt) {
    evt.preventDefault();

    try {
      const transactionDetails = {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
      };
      const hashedTransaction = sha256(utf8ToBytes(JSON.stringify(transactionDetails)));  
      const signedTransaction = secp256k1.sign(hashedTransaction, privateKey);

      setSignedTransaction(signedTransaction.toDERHex());
      setCanSubmit(false);
      closeModal();
    } catch (error) {
      alert(error);
      closeModal();
    }
    
  }

  return (
    <>
      <form className="container transfer" onSubmit={transfer}>
        <h1>Send Transaction</h1>

        <label>
          Send Amount
          <input
            placeholder="1, 2, 3..."
            value={sendAmount}
            onChange={setValue(setSendAmount)}
          ></input>
        </label>

        <label>
          Recipient
          <input
            placeholder="Type an address, for example: 0x2"
            value={recipient}
            onChange={setValue(setRecipient)}
          ></input>
        </label>
        <button type="button" className="button" onClick={() => showModal()}>Sign Transaction</button>
        <button type="submit" className="button" disabled={canSubmit}>Transfer</button>
      </form>
      
      <div id="signModal" className="signModal">
        <div className="modalContent">
          <form onSubmit={signTransaction}>
            <h1>Sign your Transaction</h1>
            <input
              placeholder="Private Key"
              value={privateKey}
              onChange={setValue(setPrivateKey)}
              className="privateKeyInput"
            ></input>
            <input type="submit" className="button" value="Sign" disabled={!privateKey}/>
          </form>
        </div>
      </div>
    </>
    
  );
}

export default Transfer;
