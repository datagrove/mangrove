import { createJWS, decodeJWT } from 'did-jwt';
import { encode } from './bs58';

// generated by chatpgt

// Generate a new ECDSA keypair
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  {
    name: 'ECDSA',
    namedCurve: 'P-256',
  },
  true,
  ['sign', 'verify']
);

// Convert the public key to a DER format
const publicKeyDer = new Uint8Array(await crypto.subtle.exportKey('spki', publicKey));

// Encode the DER public key using Base58
const publicKeyBase58 = encode(publicKeyDer);

// Create a DID document
const didDocument = {
  '@context': 'https://www.w3.org/ns/did/v1',
  id: `did:key:${publicKeyBase58}`,
  publicKey: [
    {
      id: `${publicKeyBase58}#publicKey`,
      type: 'EcdsaSecp256k1VerificationKey2019',
      publicKeyHex: Buffer.from(publicKeyDer).toString('hex'),
    },
  ],
  authentication: [
    {
      type: 'EcdsaSecp256k1SignatureAuthentication2019',
      publicKey: `${publicKeyBase58}#publicKey`,
    },
  ],
};

// Convert the DID document to JSON
const didDocumentJson = JSON.stringify(didDocument);

// Create a JWS token with the DID document
const jws = await createJWS(didDocumentJson, { alg: 'ES256K', issuer: `did:key:${publicKeyBase58}` }, privateKey);

// Decode the JWS token to get the signed DID document
const decodedJws = decodeJWT(jws);
//const signedDidDocument = JSON.parse(decodedJw.payload);

// The signed DID document is now ready to be published to a decentralized network
