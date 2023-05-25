package logdb

type SockLike interface {
	Send(v interface{}) error
	Listen(fn func(v interface{}))
}
