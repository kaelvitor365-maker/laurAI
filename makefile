SHELL := /bin/sh
LLM_MODEL := qwen3:8b

.DEFAULT_GOAL := help

.PHONY: help check install setup models

help:
	@printf '%s\n' \
		'Comandos disponíveis:' \
		'  make check    - Verifica as ferramentas instaladas' \
		'  make install  - Instala as dependências do projeto' \
		'  make setup    - Prepara as dependências do projeto' \
		'  make models   - Baixa os modelos do Ollama'

check:
	@command -v node >/dev/null 2>&1 || { \
		echo 'Erro: Node.js não está instalado.'; exit 1; \
	}
	@command -v npm >/dev/null 2>&1 || { \
		echo 'Erro: npm não está instalado.'; exit 1; \
	}
	@echo "Node.js: $$(node --version)"
	@echo "npm: $$(npm --version)"
	@if command -v ollama >/dev/null 2>&1; then \
		ollama --version; \
	else \
		echo 'Aviso: Ollama não encontrado.'; \
	fi

install: check
	npm ci

setup: install

models:
	@command -v ollama >/dev/null 2>&1 || { \
		echo 'Erro: instale o Ollama primeiro.'; exit 1; \
	}
	ollama pull $(LLM_MODEL)
	ollama pull nomic-embed-text