interface FoundationProps {
  foundation: number;
}

export function Foundation({ foundation }: FoundationProps) {
  return (
    <div className="foundation">
      {Array.from({ length: 8 }, (_, index) => {
        const filled = index < foundation;

        return (
          <div
            key={index}
            className={filled ? 'foundation__slot foundation__slot--filled' : 'foundation__slot foundation__slot--empty'}
          >
            {filled ? (
              <div className="foundation__card">
                <span className="foundation__rank">K</span>
                <span className="foundation__suit">♠</span>
              </div>
            ) : (
              <div className="foundation__index">{index + 1}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
