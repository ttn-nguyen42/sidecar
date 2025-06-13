package provider

import (
	"database/sql"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

type DbProvider interface {
	GetDb() *sql.DB
}

func (p *Provider) GetDb() *sql.DB {
	return p.sqlite
}

func (p *Provider) loadDb() error {
	_, err := enforceFileExist(p.c.SqlitePath)
	if err != nil {
		return err
	}

	abs, err := filepath.Abs(p.c.SqlitePath)
	if err != nil {
		return err
	}

	queryStr := fmt.Sprintf("file:%s?cache=shared&_journal=WAL", abs)

	db, err := sql.Open("sqlite3", queryStr)
	if err != nil {
		return err
	}

	p.sqlite = db

	return nil
}

func enforceFileExist(path string) (bool, error) {
	info, err := os.Stat(path)
	if err == nil {
		if info.IsDir() {
			return false, fmt.Errorf("sqlite db path is not a file")
		}
		return true, nil
	}

	if !errors.Is(err, fs.ErrNotExist) {
		return false, err
	}

	file, err := os.Create(path)
	if err != nil {
		return false, err
	}
	file.Close()

	return true, nil
}
