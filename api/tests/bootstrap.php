<?php

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

if (method_exists(Dotenv::class, 'bootEnv')) {
    (new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
}

if ($_SERVER['APP_DEBUG']) {
    umask(0000);
}

// Antes de las pruebas: la BBDD de pruebas (juegalmi_test) con el esquema al día.
// Se usan las MIGRACIONES (no schema:create) para tener también los CHECK y los triggers (A-09).
passthru(sprintf('php "%s/bin/console" doctrine:migrations:migrate --env=test --no-interaction --quiet', dirname(__DIR__)), $codigo);
if ($codigo !== 0) {
    exit('No se ha podido preparar la BBDD de pruebas (¿existe juegalmi_test y .env.test.local?)'.PHP_EOL);
}
