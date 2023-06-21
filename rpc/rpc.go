package rpc

import "context"

type Api func(c context.Context, data []byte) (any, error)

type ApiMap struct {
}

func (a *ApiMap) AddRpcj(name string, fn Api) {

}
func (a *ApiMap) AddRpc(name string, fn Api) {

}
func (a *ApiMap) AddNotifyj(name string, fn Api) {

}
func (a *ApiMap) AddNotify(name string, fn Api) {

}
