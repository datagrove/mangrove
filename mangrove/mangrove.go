package mangrove

import "embed"

var (
	//go:embed ui/dist/**
	Res embed.FS
)
