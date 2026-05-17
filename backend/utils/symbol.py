# Known Indian index symbols — pass through unchanged
INDEX_SYMBOLS = {'^NSEI', '^BSESN', '^NSEBANK', '^CNXIT', '^NSEMDCP50', '^CNXFMCG'}

# Known BSE-only symbols
BSE_ONLY = {'SENSEX'}

def normalize(raw: str) -> str:
    """
    Normalize a user-entered symbol to a yfinance-compatible ticker.

    Rules:
      - Already has suffix (.NS / .BO) → return as-is (uppercased)
      - Index symbol (^...) → return as-is
      - Otherwise → append .NS  (NSE is primary exchange)
    """
    sym = raw.strip().upper()
    if not sym:
        raise ValueError('Symbol cannot be empty')
    if sym in INDEX_SYMBOLS or sym.startswith('^'):
        return sym
    if '.' in sym:
        return sym
    return sym + '.NS'

def display_name(sym: str) -> str:
    """Strip exchange suffix for display."""
    return sym.replace('.NS', '').replace('.BO', '')

def is_index(sym: str) -> bool:
    return sym.startswith('^')
