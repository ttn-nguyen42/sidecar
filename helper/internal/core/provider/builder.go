package provider

import (
	"github.com/Masterminds/squirrel"
)

type BuilderProvider interface {
	GetBuilder() squirrel.StatementBuilderType
}

func (p *Provider) GetBuilder() squirrel.StatementBuilderType {
	return p.stmtBuilder
}

func (p *Provider) loadBuilder() {
	p.stmtCache = squirrel.NewStmtCache(p.sqlite)

	p.stmtBuilder = squirrel.StatementBuilder.RunWith(p.stmtCache)
}
