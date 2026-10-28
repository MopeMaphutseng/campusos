% Transient response for series RLC (capacitor voltage)
L = 47e-3;
C = 0.1e-6;   % 0.1 uF = 1e-7 F
vT = 10;      % step to 10 V
Rvals = [220, 2200, 4700];
t = linspace(0, 0.01, 2000); % 0 to 10 ms

for k = 1:length(Rvals)
    R = Rvals(k);
    alpha = R/(2*L);
    omega0 = 1/sqrt(L*C);
    if alpha < omega0
        omega_d = sqrt(omega0^2 - alpha^2);
        vout = vT*(1 - exp(-alpha.*t).*(cos(omega_d.*t) + (alpha/omega_d).*sin(omega_d.*t)));
    else
        % overdamped (two real roots) - approximate with single exponential approach
        vout = vT*(1 - exp(-alpha.*t)); % simple approximate
    end
    figure;
    plot(t*1000, vout);
    xlabel('Time (ms)');
    ylabel('v_{out} (V)');
    title(['Transient, R = ', num2str(R), ' \Omega']);
end
