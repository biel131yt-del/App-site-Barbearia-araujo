-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoCentavos" INTEGER NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 40,
    "descricao" TEXT NOT NULL DEFAULT '',
    "fotoUrl" TEXT,
    "faixa" TEXT NOT NULL DEFAULT 'adulto',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "bonusResetEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disponibilidade" (
    "id" TEXT NOT NULL,
    "dataISO" TEXT NOT NULL,
    "inicio" TEXT NOT NULL,
    "fim" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disponibilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "dataISO" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "pagamento" TEXT NOT NULL DEFAULT 'local',
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "pagamentoId" TEXT,
    "qrTexto" TEXT,
    "pushStatus" TEXT NOT NULL DEFAULT 'pendente',
    "googleStatus" TEXT NOT NULL DEFAULT 'pendente',
    "emailStatus" TEXT NOT NULL DEFAULT 'pendente',
    "servicoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleConta" (
    "id" TEXT NOT NULL DEFAULT 'principal',
    "refreshToken" TEXT NOT NULL,
    "email" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushInscricao" (
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushInscricao_pkey" PRIMARY KEY ("endpoint")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'admin',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaixaFechamento" (
    "dataISO" TEXT NOT NULL,
    "totalCentavos" INTEGER NOT NULL,
    "totalPix" INTEGER NOT NULL,
    "totalDinheiro" INTEGER NOT NULL,
    "qtd" INTEGER NOT NULL,
    "fechadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaixaFechamento_pkey" PRIMARY KEY ("dataISO")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "fidelidadeAtiva" BOOLEAN NOT NULL DEFAULT true,
    "cortesParaGratis" INTEGER NOT NULL DEFAULT 10,
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "mensagemWhats" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
