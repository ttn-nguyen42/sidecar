package config

type Options struct {
	OnChange OnChangeHandler
}

type Option func(o *Options)

func newOptions(opts ...Option) *Options {
	def := &Options{}
	for _, opt := range opts {
		opt(def)
	}
	return def
}

func WithOnChange(handler OnChangeHandler) Option {
	return func(o *Options) {
		o.OnChange = handler
	}
}
