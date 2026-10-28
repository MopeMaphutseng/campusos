L = 47e-3;
C = 0.1e-6;
Rvals = [220, 2200, 4700];
omega = logspace(log10(2*pi*100), log10(2*pi*10000), 1000);

for k = 1:length(Rvals)
    R = Rvals(k);
    H = 1 ./ sqrt( (1 - (omega.^2)*L*C).^2 + (omega*R*C).^2 );
    phase = -atan( (omega*R*C) ./ (1 - (omega.^2)*L*C) ) * 180/pi;
    figure;
    loglog(omega/(2*pi), H); % plot vs frequency in Hz
    xlabel('Frequency (Hz)');
    ylabel('|Vout/Vin|');
    title(['Magnitude, R = ', num2str(R), ' \Omega']);
    figure;
    semilogx(omega/(2*pi), phase);
    xlabel('Frequency (Hz)');
    ylabel('Phase (deg)');
    title(['Phase, R = ', num2str(R), ' \Omega']);
end
