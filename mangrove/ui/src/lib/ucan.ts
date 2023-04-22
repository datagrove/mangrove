import * as ucans from "@ucans/ucans"

// CID = concise identifier

// a distributed database may require validating ucan issued by a collaborator
async function verify(encoded: string) {
  const myDID = "did:key:zabcde..."

  // verify an invocation of a UCAN on another machine (in this example a service)
  const result = await ucans.verify(encoded, {
    // to make sure we're the intended recipient of this UCAN
    audience: myDID,
    // A callback for figuring out whether a UCAN is known to be revoked
    isRevoked: async ucan => false, // as a stub. Should look up the UCAN CID in a DB.
    // capabilities required for this invocation & which owner we expect for each capability
    requiredCapabilities: [
      {
        capability: {
          with: { scheme: "mailto", hierPart: "boris@fission.codes" },
          can: { namespace: "msg", segments: ["SEND"] }
        },
        rootIssuer: myDID, // check against a known owner of the boris@fission.codes email address
      }
    ]
  })

  if (result.ok) {
    // The UCAN authorized the user
  } else {
    // Unauthorized
  }
}
// Delegation semantics for path-like capabilities (e.g. "path:/home/abc/")
async function delegate() {
const PATH_SEMANTICS = {
    canDelegateResource: (parentRes:ucans.ResourcePointer, childRes:ucans.ResourcePointer) => {
      if (parentRes.scheme !== "path" || childRes.scheme !== "path") {
        // If this is not about the "path" capability, then
        // just use the normal equality delegation
        return ucans.equalCanDelegate.canDelegateResource(parentRes, childRes)
      }

      // we've got access to everything
      if (parentRes.hierPart === "root") {
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
    canDelegateAbility: (parent: ucans.Ability,child:ucans.Ability)=>true
  }
}
