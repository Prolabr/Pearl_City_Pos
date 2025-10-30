const Header = () => (
  <header className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-[var(--shadow-medium)]">
    <div className="container mx-auto px-4 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          PEARL CITY HOTEL (PVT) LTD
        </h1>
        <p className="text-lg md:text-xl font-semibold opacity-95">
          AUTHORIZED FOREIGN MONEY CHANGER
        </p>
        <div className="text-sm md:text-base opacity-90 space-y-1">
          <p>17, Baudhaloka Mawatha, Colombo - 04</p>
          <p>Tel: 0114523800 (Auto Lines)</p>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
