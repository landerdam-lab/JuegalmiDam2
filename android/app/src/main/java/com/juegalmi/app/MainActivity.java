package com.juegalmi.app;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Splash (PT-01): tiene que ir ANTES de super.onCreate. Muestra Theme.JuegAlmi.Splash
        // y luego cambia al tema normal (postSplashScreenTheme = Theme.JuegAlmi)
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        // Edge-to-edge: la app ocupa toda la pantalla, también detrás de las barras del sistema
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        // Como dibujamos detrás de las barras, sumamos su tamaño al padding para que no tapen el contenido
        int margen = getResources().getDimensionPixelSize(R.dimen.ja_espacio_4);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets barras = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(barras.left + margen, barras.top + margen,
                    barras.right + margen, barras.bottom + margen);
            return insets;
        });
    }
}
