package provider

import (
	"database/sql"
	"net/http"

	"github.com/Masterminds/squirrel"
	whisper "github.com/ggerganov/whisper.cpp/bindings/go"
	"github.com/philippgille/chromem-go"
	"github.com/tmc/langchaingo/llms"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
)

type Provider struct {
	c              *config.Config
	modelByPurpose map[LlmPurpose]llms.Model
	client         *http.Client
	whisper        *whisper.Context
	vector         *chromem.DB
	sqlite         *sql.DB
	stmtCache      *squirrel.StmtCache
	stmtBuilder    squirrel.StatementBuilderType
}

func NewProvider(c *config.Config) *Provider {
	return &Provider{
		c:              c,
		modelByPurpose: make(map[LlmPurpose]llms.Model),
	}
}

func (p *Provider) Load() error {
	return p.load()
}

func (p *Provider) load() error {
	p.initHttpClient()
	err := p.loadLlm()
	if err != nil {
		return err
	}
	err = p.loadTranscriber()
	if err != nil {
		return err
	}
	err = p.loadVector()
	if err != nil {
		return err
	}
	err = p.loadDb()
	if err != nil {
		return err
	}
	p.loadBuilder()
	return nil
}
