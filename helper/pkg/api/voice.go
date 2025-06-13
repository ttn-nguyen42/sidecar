package api

import "net/http"

type voice struct {
}

func newVoice() *voice {
	return &voice{}
}

func (v *voice) Register(sm *http.ServeMux) {
}
