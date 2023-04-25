package mangrove

import "embed"

var (
	//go:embed ui/dist/**
	Res embed.FS

	// go:embed asset/**
	Asset embed.FS
)
