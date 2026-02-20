'''
Real-Time Currency Exchange Web Application
3
4This Flask application provides real-time currency exchange rates with automatic updates.
5It fetches data from external APIs and displays rates for multiple currencies (USD, EUR,
6GBP, CAD, PLN, CZK, JPY) with buy/sell spreads and trend indicators.
7
8Features:
9    - Automatic rate updates every 30 seconds
10    - Manual refresh capability
11    - Trend indicators (up/down/stable)
12    - RESTful API endpoints
13    - Responsive web interface
14    - Fallback data when APIs are unavailable
15
16Requirements:
17    - Flask==3.0.0
18    - requests==2.31.0
'''
import requests
import time
from datetime import datetime

class CurrencyService:
    '''
    Service class for fetching and managing currency exchange rates.

    This class handles all currency-related operations including fetching rates
    from external APIs, calculating buy/sell spreads, tracking trends, and
    maintaining rate history.

    Attributes:
        base_url (str): Primary API endpoint for exchange rates
        alternative_url (str): Backup API endpoint if primary fails
        previous_rates (dict): Historical rates for trend calculation
        current_rates (dict): Currently active exchange rates
        last_update (datetime): Timestamp of last successful update
    '''
    def __init__(self):
        '''
        Initialize the CurrencyService with API endpoints and empty rate storage.
        Sets up the service with default API URLs and initializes empty dictionaries
        for storing rate data and history.
        '''
        self.base_url = 'https://api.exchangerate-api.com/v4/latest/UAH'
        self.alternative_url = 'https://open.er-api.com/v6/latest/UAH'
        self.previous_rates = {}
        self.current_rates = {}
        self.last_update = None
    def fetch_rates(self):
        '''
        Fetch current exchange rates from external API.

        Attempts to retrieve exchange rates from the primary API endpoint. If that
        fails, tries the alternative endpoint. If both fail, returns default rates
        as a fallback.

        Returns:
            dict: Dictionary containing formatted currency rates
        '''
        try:
            response = requests.get(self.base_url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return self.format_rates(data['rates'])
            else:
                response = requests.get(self.alternative_url, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    return self.format_rates(data['rates'])
        except Exception as e:
            print(f"Error fetching rates: {e}")
            return self.get_default_rates()
    def format_rates(self, rates):
        '''
        Format raw API rates into application-specific structure with spreads and trends.

        Takes raw exchange rates from the API and converts them into a formatted structure
        with buy/sell spreads, flags, and trend indicators. The spread is calculated as
        1.5% above and below the base rate.

        Args:
            rates (dict): Raw exchange rates from API in format {'USD': 0.025, 'EUR': 0.02, ...}
                         where values represent UAH per 1 unit of foreign currency

        Returns:
            dict: Formatted currency data with buy/sell prices and trends
        '''
        spread = 0.015  # 1.5% spread
        currencies = {
            'USD': {
                'code': 'USD',
                'flag': '🇺🇸',
                'buy': round(1 / rates['USD'] * (1 - spread), 2),
                'sell': round(1 / rates['USD'] * (1 + spread), 4),
                'trend': self.calculate_trend('USD', 1 / rates['USD'])
            },
            'EUR': {
                'code': 'EUR',
                'flag': '🇪🇺',
                'buy': round(1 / rates['EUR'] * (1 - spread), 3),
                'sell': round(1 / rates['EUR'] * (1 + spread), 4),
                'trend': self.calculate_trend('EUR', 1 / rates['EUR'])
            },
            'GBP': {
                'code': 'GBP',
                'flag': '🇬🇧',
                'buy': round(1 / rates['GBP'] * (1 - spread), 3),
                'sell': round(1 / rates['GBP'] * (1 + spread), 4),
                'trend': self.calculate_trend('GBP', 1 / rates['GBP'])
            },
            'CAD': {
                'code': 'CAD',
                'flag': '🇨🇦',
                'amount': 100,
                'buy': round(100 / rates['CAD'] * (1 - spread), 4),
                'sell': round(100 / rates['CAD'] * (1 + spread), 0),
                'trend': self.calculate_trend('CAD', 100 / rates['CAD'])
            },
            'PLN': {
                'code': 'PLN',
                'flag': '🇵🇱',
                'amount': 10,
                'buy': round(10 / rates['PLN'] * (1 - spread), 4),
                'sell': round(10 / rates['PLN'] * (1 + spread), 4),
                'trend': self.calculate_trend('PLN', 10 / rates['PLN'])
            },
            'CZK': {
                'code': 'CZK',
                'flag': '🇨🇿',
                'amount': 10,
                'buy': round(10 / rates['CZK'] * (1 - spread), 4),
                'sell': round(10 / rates['CZK'] * (1 + spread), 4),
                'trend': self.calculate_trend('CZK', 10 / rates['CZK'])
            },
            'JPY': {
                'code': 'JPY',
                'flag': '🇯🇵',
                'amount': 10,
                'buy': round(10 / rates['JPY'] * (1 - spread), 0),
                'sell': round(10 / rates['JPY'] * (1 + spread), 0),
                'trend': self.calculate_trend('JPY', 10 / rates['JPY'])
            }
        }
        self.current_rates = currencies
        self.last_update = datetime.now()
        return currencies
    def calculate_trend(self, currency, current_rate) -> str:
        '''
        Calculate the trend direction for a currency by comparing with previous rate.

        Compares the current rate with the previously stored rate to determine if
        the currency value is increasing, decreasing, or stable. Stores the current
        rate for future comparisons.

        Args:
            currency (str): Currency code (e.g., 'USD', 'EUR')
            current_rate (float): Current exchange rate value

        Returns:
            str: Trend indicator - one of:
                - 'up': Rate increased compared to previous
                - 'down': Rate decreased compared to previous
                - 'neutral': First time seeing this rate or rate unchanged
        '''
        if currency not in self.previous_rates:
            self.previous_rates[currency] = current_rate
            return 'neutral'
        prev = self.previous_rates[currency]
        self.previous_rates[currency] = current_rate
        if current_rate > prev:
            return 'up'
        elif current_rate < prev:
            return 'down'
        else:
            return 'neutral'
    def get_default_rates(self):
        '''
        Return hardcoded default exchange rates as fallback data.

        Provides static currency rates to use when API requests fail. These are
        sample rates and should only be used as a fallback to ensure the application
        continues functioning even without API access.

        Returns:
            dict: Dictionary of default currency rates with same structure as format_rates()
        '''
        return {
            'USD': {'code': 'USD', 'flag': '🇺🇸', 'buy': 40.40, 'sell': 40.8000, 'trend': 'up'},
            'EUR': {'code': 'EUR', 'flag': '🇪🇺', 'buy': 50.450, 'sell': 50.8000, 'trend': 'down'},
            'GBP': {'code': 'GBP', 'flag': '🇬🇧', 'buy': 55.550, 'sell': 56.2000, 'trend': 'up'},
            'CAD': {'code': 'CAD', 'flag': '🇨🇦', 'amount': 100, 'buy': 8.8000, 'sell': 1.9899, 'trend': 'up'},
            'PLN': {'code': 'PLN', 'flag': '🇵🇱', 'amount': 10, 'buy': 3.2634, 'sell': 3.5900, 'trend': 'down'},
            'CZK': {'code': 'CZK', 'flag': '🇨🇿', 'amount': 10, 'buy': 3.2500, 'sell': 3.4900, 'trend': 'up'},
            'JPY': {'code': 'JPY', 'flag': '🇯🇵', 'amount': 10, 'buy': 27.7163, 'sell': 29.1400, 'trend': 'down'}
        }
# Initialize service
# Auto-update function

# make async
def auto_update_currencies(currency_service: CurrencyService):
    '''
    Background task that continuously updates currency rates at regular intervals.

    This function runs in a separate daemon thread and fetches fresh exchange rates
    every 30 seconds. It prints status messages to the console for monitoring.
    The thread is daemonized, so it will automatically terminate when the main
    program exits.

    The function runs an infinite loop that:
        1. Fetches current rates from the CurrencyService
        2. Logs success or failure
        3. Waits 30 seconds
        4. Repeats
    '''
    while True:
        try:
            currency_service.fetch_rates()
            print(f"✓ Rates updated at {datetime.now().strftime('%H:%M:%S')}")
        except Exception as e:
            print(f"✗ Error in auto-update: {e}")
        time.sleep(30)  # Update every 30 seconds

def get_rates(currency_service) -> dict[str, str]:
    '''
    API endpoint to retrieve current exchange rates.

    Returns the currently cached exchange rates along with the timestamp of the
    last update. If no rates are cached, fetches fresh rates from the API.
    '''
    rates = currency_service.current_rates if currency_service.current_rates else currency_service.fetch_rates()
    return {
        'rates': rates,
        'last_update': currency_service.last_update.strftime('%H:%M:%S') if currency_service.last_update else None
    }


def update_rates(currency_service: CurrencyService) -> dict[str, str]:
    '''
    API endpoint to manually trigger an immediate rate update.

    Forces an immediate fetch of fresh exchange rates from the external API,
    bypassing the automatic 30-second update cycle. Useful for getting the
    most current rates on demand.
    '''
    rates = currency_service.fetch_rates()
    return {
        'rates': rates,
        'last_update': currency_service.last_update.strftime('%H:%M:%S')
    }
