package logdb

// is this enough to allow federation?
// proposals are not in the same order as the commits; so if the proxy is online, but the eventual target is not, the commits can proceed and the proposals are stalled.

type RemoteStoreConnection interface {
}

type RemoteStoreSimple struct {
}
