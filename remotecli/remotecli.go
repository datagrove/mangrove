package remotecli

import (
	sh "github.com/kballard/go-shellquote"
)

func runtime_args(cmdString string) ([]string, error) {
	return sh.Split(cmdString)
}
