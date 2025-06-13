package provider

import (
	"errors"
	"fmt"
	"io/fs"
	"os"

	"github.com/philippgille/chromem-go"
)

type VectorProvider interface {
	GetVector() *chromem.DB
}

func (p *Provider) GetVector() *chromem.DB {
	return p.vector
}

func (p *Provider) loadVector() error {
	_, err := enforceDirExist(p.c.VectorPath)
	if err != nil {
		return err
	}

	db, err := chromem.NewPersistentDB(p.c.VectorPath, true)
	if err != nil {
		return fmt.Errorf("failed to initialized persistent vector db: %w", err)
	}
	p.vector = db

	return nil
}

func enforceDirExist(dir string) (bool, error) {
	info, err := os.Stat(dir)
	if err == nil {
		if !info.IsDir() {
			return false, fmt.Errorf("vector db path is not a directory")
		}
		return true, nil
	}

	if !errors.Is(err, fs.ErrNotExist) {
		return false, err
	}

	err = os.MkdirAll(dir, 0777)
	if err != nil {
		return false, err
	}

	return true, nil
}
