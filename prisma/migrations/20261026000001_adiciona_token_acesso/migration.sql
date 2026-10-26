-- Adiciona campo tokenAcesso ao Agendamento para operações públicas seguras
ALTER TABLE "Agendamento" ADD COLUMN "tokenAcesso" TEXT UNIQUE;

-- Índice para busca rápida por token
CREATE INDEX "Agendamento_tokenAcesso_idx" ON "Agendamento"("tokenAcesso");
