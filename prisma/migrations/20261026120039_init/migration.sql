-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "precoCentavos" INTEGER NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 40,
    "descricao" TEXT NOT NULL DEFAULT '',
    "fotoUrl" TEXT,
    "faixa" TEXT NOT NULL DEFAULT 'adulto',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "bonusResetEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Disponibilidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataISO" TEXT NOT NULL,
    "inicio" TEXT NOT NULL,
    "fim" TEXT NOT NULL,
    "slotMin" INTEGER NOT NULL DEFAULT 60,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataISO" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "pagamento" TEXT NOT NULL DEFAULT 'local',
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "pagamentoId" TEXT,
    "qrTexto" TEXT,
    "trocoPara" TEXT,
    "pushStatus" TEXT NOT NULL DEFAULT 'pendente',
    "googleStatus" TEXT NOT NULL DEFAULT 'pendente',
    "emailStatus" TEXT NOT NULL DEFAULT 'pendente',
    "confirmadoWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "motivoCancelamento" TEXT,
    "canceladoEm" DATETIME,
    "servicoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Agendamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agendamentoId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Avaliacao_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListaEspera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "servicoId" TEXT NOT NULL,
    "dataISO" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "horaPreferida" TEXT,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "atendido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListaEspera_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoogleConta" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'principal',
    "refreshToken" TEXT NOT NULL,
    "email" TEXT,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PushInscricao" (
    "endpoint" TEXT NOT NULL PRIMARY KEY,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'admin',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "expiraEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CaixaFechamento" (
    "dataISO" TEXT NOT NULL PRIMARY KEY,
    "totalCentavos" INTEGER NOT NULL,
    "totalPix" INTEGER NOT NULL,
    "totalDinheiro" INTEGER NOT NULL,
    "qtd" INTEGER NOT NULL,
    "fechadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "fidelidadeAtiva" BOOLEAN NOT NULL DEFAULT true,
    "cortesParaGratis" INTEGER NOT NULL DEFAULT 10,
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "mensagemWhats" TEXT NOT NULL DEFAULT ''
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefone_key" ON "Cliente"("telefone");

-- CreateIndex
CREATE INDEX "Disponibilidade_dataISO_idx" ON "Disponibilidade"("dataISO");

-- CreateIndex
CREATE UNIQUE INDEX "Disponibilidade_dataISO_inicio_key" ON "Disponibilidade"("dataISO", "inicio");

-- CreateIndex
CREATE INDEX "Agendamento_dataISO_idx" ON "Agendamento"("dataISO");

-- CreateIndex
CREATE INDEX "Agendamento_clienteId_idx" ON "Agendamento"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_dataISO_hora_key" ON "Agendamento"("dataISO", "hora");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_agendamentoId_key" ON "Avaliacao"("agendamentoId");

-- CreateIndex
CREATE INDEX "ListaEspera_dataISO_idx" ON "ListaEspera"("dataISO");

-- CreateIndex
CREATE INDEX "ListaEspera_atendido_idx" ON "ListaEspera"("atendido");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");
