package store

type FileInfo struct {
	Path string `json:"path,omitempty"`
}
type Fsi interface {
	Write(sid int64, filePath string, data []byte) error
	Ls(sid int64) ([]FileInfo, error)
	Read(sid int64, filePath string) ([]byte, error)
	Delete(sid int64, filePath string) error
}
