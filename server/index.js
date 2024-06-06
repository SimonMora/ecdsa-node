const express = require("express");
const { secp256k1 }  = require("ethereum-cryptography/secp256k1");

const { sha256 } = require("ethereum-cryptography/sha256");
const { utf8ToBytes} = require("ethereum-cryptography/utils");


const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "03f2496550c707096a41f1a2471e9f0517bbfb6ad755ba7a0b1fc4b4db6204f5b1": 100,
  "03ffa8a95004b0d57e76f0727528d510a6a35255bbdd55df8b60c61af95632911e": 50,
  "026666b16b1dfc4530db18b3dd371ad03cf816c14ba26debc7cc243d9e667515c4": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, sign } = req.body;

  const transactionDetails = {
    sender,
    amount,
    recipient,
  };
  const hashedMessage = sha256(utf8ToBytes(JSON.stringify(transactionDetails)));

  const isSigned = secp256k1.verify(sign.replaceAll('"',''), hashedMessage, sender);

  if (isSigned) {
    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  } else {
    res.status(400).send({ message: "Sign is incorrect, please verify!" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
