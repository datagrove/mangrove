import * as ucans from "ucans"

// in-memory keypair
const keypair = await ucans.EdKeypair.create()
const ucan = await ucans.build({
  audience: "did:key:zabcde...", // recipient DID
  issuer: keypair, // signing key
  capabilities: [ // permissions for ucan
    {
      with: { scheme: "wnfs", hierPart: "//boris.fission.name/public/photos/" },
      can: { namespace: "wnfs", segments: [ "OVERWRITE" ] }
    },
    {
      with: { scheme: "wnfs", hierPart: "//boris.fission.name/private/6m-mLXYuXi5m6vxgRTfJ7k_xzbmpk7LeD3qYt0TM1M0" },
      can: { namespace: "wnfs", segments: [ "APPEND" ] }
    },
    {
      with: { scheme: "mailto", hierPart: "boris@fission.codes" },
      can: { namespace: "msg", segments: [ "SEND" ] }
    }
  ]
})
const token = ucans.encode(ucan) // base64 jwt-formatted auth token

// You can also use your own signing function if you're bringing your own key management solution
const payload = await ucans.buildPayload(...)
const ucan = await ucans.sign(payload, keyType, signingFn)

const serviceDID = "did:key:zabcde..."

// Generate a UCAN on one machine
const ucan = ucans.build({ ... })

// encode the UCAN to send it over to another machine
const encoded = ucans.encode(ucan)

// verify an invocation of a UCAN on another machine (in this example a service)
const result = await ucans.verify(encoded, {
  // to make sure we're the intended recipient of this UCAN
  audience: serviceDID,
  // A callback for figuring out whether a UCAN is known to be revoked
  isRevoked: async ucan => false // as a stub. Should look up the UCAN CID in a DB.
  // capabilities required for this invocation & which owner we expect for each capability
  requiredCapabilities: [
    {
      capability: {
        with: { scheme: "mailto", hierPart: "boris@fission.codes" },
        can: { namespace: "msg", segments: [ "SEND" ] }
      },
      rootIssuer: borisDID, // check against a known owner of the boris@fission.codes email address
    }
  ],
)

if (result.ok) {
  // The UCAN authorized the user
} else {
  // Unauthorized
}

// Delegation semantics for path-like capabilities (e.g. "path:/home/abc/")
const PATH_SEMANTICS = {
  canDelegateResource: (parentRes, childRes) => {
    if (parentRes.with.scheme !== "path" || childRes.with.scheme !== "path") {
      // If this is not about the "path" capability, then
      // just use the normal equality delegation
      return ucans.equalCanDelegate.canDelegateResource(parentRes, childRes)
    }

    // we've got access to everything
    if (parentRes.hierPart === ucans.capability.superUser.SUPERUSER) {
      return true
    }

    // path must be the same or a path below
    if (`${childRes.hierPart}/`.startsWith(`${parentRes.hierPart}/`)) {
      return true
    }

    // 🚨 cannot delegate
    return false
  },

  // we're reusing equalCanDelegate's semantics for ability delegation
  canDelegateAbility: equalCanDelegate.canDelegateAbility
}
