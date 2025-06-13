package provider

import (
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
	"go.uber.org/zap"
)

type LlmPurpose string

var (
	// LLM optimized for quick chat, rapid response.
	LlmChat LlmPurpose = "chat"

	// LLM optimized for performing instruction
	LlmInstruct LlmPurpose = "instruct"

	// LLM optimized for converting text documents into vectors
	LlmEmbedding LlmPurpose = "embedding"
)

type LlmProvider interface {
	// GetLlm returns a preloaded Langchain LLM model.
	// It's eagerly initialized and guaranteed to be correct
	GetLlm(purpose LlmPurpose) llms.Model
}

func (p *Provider) GetLlm(purpose LlmPurpose) llms.Model {
	model, exists := p.modelByPurpose[purpose]
	if !exists {
		logger.Fatal("model not found, this should not happens", zap.String("purpose", string(purpose)))
	}

	return model
}

func (p *Provider) loadLlm() error {
	names := getModelNameByPurpose(p.c.Model)

	models := make([]string, len(names))

	for pur, name := range names {
		model, err := openai.New(
			openai.WithModel(name),
			openai.WithToken(p.c.Model.Token),
			openai.WithEmbeddingModel(p.c.Model.Embedding),
			openai.WithResponseFormat(openai.ResponseFormatJSON),
			openai.WithAPIType(openai.APITypeOpenAI),
			openai.WithHTTPClient(p.client))
		if err != nil {
			logger.Error("load model failed",
				zap.String("model", name),
				zap.Error(err))
			return err
		}
		p.modelByPurpose[pur] = model

		models = append(models, name)
	}

	logger.Info("loaded all models", zap.Any("models", models))

	return nil
}

func getModelNameByPurpose(c *config.Model) map[LlmPurpose]string {
	n := make(map[LlmPurpose]string)
	n[LlmChat] = c.Chat
	n[LlmInstruct] = c.Instruct
	return n
}
