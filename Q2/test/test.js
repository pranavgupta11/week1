const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");
        // Providing two inputs as a and b with values 1 and 2
        console.log('1x2 =',publicSignals[0]); //verifying the input 

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true; //if the value matches it returns true as we have provided the correct inputs
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;
  
    beforeEach(async function () {
      //[assignment] insert your script here
      Verifier = await ethers.getContractFactory("Verifier");
      verifier = await Verifier.deploy();
      await verifier.deployed();
    });
  
    it("Should return true for correct proof", async function () {
      //[assignment] insert your script here
  
      const { proof, publicSignals } = await groth16.fullProve(
        { a: "2", b: "3", c: "4" },
        "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm",
        "contracts/circuits/Multiplier3/circuit_final.zkey"
      );
      console.log("2x3x4 =", publicSignals[0]);
  
      const editedPublicSignals = unstringifyBigInts(publicSignals);
      const editedProof = unstringifyBigInts(proof);
      const calldata = await groth16.exportSolidityCallData(
        editedProof,
        editedPublicSignals
      );
      console.log(calldata);
      const argv = calldata
        .replace(/["[\]\s]/g, "")
        .split(",")
        .map((x) => BigInt(x).toString());
      console.log(argv);
      const a = [argv[0], argv[1]];
      const b = [
        [argv[2], argv[3]],
        [argv[4], argv[5]],
      ];
      const c = [argv[6], argv[7]];
  
      const Input = argv.slice(8);
  
      console.log(Input);
  
      expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
      //[assignment] insert your script here
      let a = [0, 0];
      let b = [
        [0, 0],
        [0, 0],
      ];
      let c = [0, 0];
      let d = [0];
      expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
  });


describe("Multiplier3 with PLONK", function () {
    let Verifier;
    let verifier;
    beforeEach(async function () {
      //[assignment] insert your script here
      Verifier = await ethers.getContractFactory("PlonkVerifier");
      verifier = await Verifier.deploy();
      await verifier.deployed();
    });
  
    it("Should return true for correct proof", async function () {
      //[assignment] insert your script here
      const { proof, publicSignals } = await plonk.fullProve(
        { a: "3", b: "4", c: "5" },
        "contracts/circuits/_plonkMultiplier3/Multiplier3_js/Multiplier3.wasm",
        "contracts/circuits/_plonkMultiplier3/circuit_final.zkey"
      );
      console.log("3x4x5 =", publicSignals[0]);
  
      const editedPublicSignals = unstringifyBigInts(publicSignals);
      const editedProof = unstringifyBigInts(proof);
      const calldata = await plonk.exportSolidityCallData(
        editedProof,
        editedPublicSignals
      );
      console.log(calldata);
  
      const x = calldata.split(",")[0];
      const y = JSON.parse(calldata.split(",")[1]);
  
      expect(await verifier.verifyProof(x, y)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
      //[assignment] insert your script here
      let p =
        "0x0000000000000000000000000000000000000000000000000000000000001111";
      let q = ["0"];
      expect(await verifier.verifyProof(p, q)).to.be.false;
    });
  });