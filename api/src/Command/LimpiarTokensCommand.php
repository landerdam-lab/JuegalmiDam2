<?php

namespace App\Command;

use App\Repository\TokenRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * php bin/console app:limpiar-tokens
 * Borra las sesiones caducadas (también se limpian solas en cada login). Se puede programar con cron.
 */
#[AsCommand(name: 'app:limpiar-tokens', description: 'Borra los tokens de sesión caducados')]
final class LimpiarTokensCommand extends Command
{
    public function __construct(private readonly TokenRepository $tokens)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $borrados = $this->tokens->borrarCaducados(new \DateTimeImmutable());
        (new SymfonyStyle($input, $output))->success(sprintf('Tokens caducados borrados: %d', $borrados));

        return Command::SUCCESS;
    }
}
