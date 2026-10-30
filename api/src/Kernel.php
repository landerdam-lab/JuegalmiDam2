<?php

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function boot(): void
    {
        // Todas las fechas se guardan y se calculan en UTC (ADR-021).
        // Las apps las reciben en ISO 8601 con zona (+00:00) y las pasan a la hora local.
        date_default_timezone_set('UTC');
        parent::boot();
    }
}
