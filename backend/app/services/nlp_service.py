"""
NLP Intent Detection Service for FinShield AI Assistant
Detects user intent and routes to appropriate modules
"""

import re
from typing import Tuple, Dict
from enum import Enum


class Intent(str, Enum):
    BUDGET = "budget"
    INVESTMENT = "investment"
    TRADING = "trading"
    TAX = "tax"
    FRAUD = "fraud"
    BUSINESS = "business"
    GENERAL = "general"


# Intent keywords for each domain
INTENT_KEYWORDS = {
    Intent.BUDGET: {
        "english": [
            "budget", "expense", "spending", "track", "spend", "money", 
            "transaction", "category", "income", "savings", "monthly", "how much",
            "save", "allocate", "limit", "analysis", "report"
        ],
        "spanish": [
            "presupuesto", "gasto", "gastos", "dinero", "ingresos", "ahorros",
            "mensual", "categoría", "transacción", "límite"
        ],
        "french": [
            "budget", "dépense", "dépenses", "argent", "revenus", "épargne",
            "mensuel", "catégorie", "transaction", "limite"
        ],
        "hindi": [
            "बजट", "खर्च", "पैसे", "आय", "बचत", "मासिक",
            "लेनदेन", "श्रेणी", "सीमा"
        ]
    },
    Intent.INVESTMENT: {
        "english": [
            "investment", "portfolio", "sip", "mutual fund", "stock", "holdings",
            "return", "risk", "calculator", "retirement", "education", "nifty",
            "sensex", "dividend", "fund", "performance", "diversify"
        ],
        "spanish": [
            "inversión", "cartera", "fondo", "acciones", "rendimiento",
            "riesgo", "calculadora", "jubilación"
        ],
        "french": [
            "investissement", "portefeuille", "fonds", "actions", "rendement",
            "risque", "calculatrice", "retraite"
        ],
        "hindi": [
            "निवेश", "पोर्टफोलियो", "म्यूचुअल फंड", "स्टॉक", "रिटर्न",
            "जोखिम", "कैलकुलेटर", "अवकाश"
        ]
    },
    Intent.TRADING: {
        "english": [
            "trading", "technical", "backtest", "signal", "chart", "trend",
            "paper trading", "market", "analysis", "momentum", "momentum",
            "ma20", "ma50", "rsi", "macd", "bollinger", "strategy"
        ],
        "spanish": [
            "comercio", "técnico", "señal", "gráfico", "tendencia",
            "mercado", "análisis", "estrategia"
        ],
        "french": [
            "trading", "technique", "signal", "graphique", "tendance",
            "marché", "analyse", "stratégie"
        ],
        "hindi": [
            "ट्रेडिंग", "तकनीकी", "संकेत", "चार्ट", "प्रवृत्ति",
            "बाजार", "विश्लेषण", "रणनीति"
        ]
    },
    Intent.TAX: {
        "english": [
            "tax", "deduction", "itr", "gst", "regime", "80c", "80d", "hra",
            "saving", "filing", "calculation", "rate", "slab", "exemption",
            "compliance", "form", "return", "refund", "income tax", "tax filing"
        ],
        "spanish": [
            "impuesto", "deducción", "declaración", "iva", "régimen",
            "cálculo", "tarifa", "declaración", "devolución"
        ],
        "french": [
            "impôt", "déduction", "déclaration", "tva", "régime",
            "calcul", "taux", "formulaire", "remboursement"
        ],
        "hindi": [
            "कर", "कटौती", "आईटीआर", "जीएसटी", "व्यवस्था",
            "बचत", "दाखिल", "गणना", "दर", "स्लैब", "रिफंड"
        ]
    },
    Intent.FRAUD: {
        "english": [
            "fraud", "suspicious", "scam", "chargeback", "dispute", "claim",
            "investigation", "risk", "alert", "recover", "unauthorized",
            "complaint", "case", "evidence", "rescue", "chargebacks", "disputes",
            "fraudulent", "suspicious transaction"
        ],
        "spanish": [
            "fraude", "sospechoso", "estafa", "reclamación", "disputa",
            "investigación", "riesgo", "alerta", "denunciar"
        ],
        "french": [
            "fraude", "suspect", "arnaque", "réclamation", "différend",
            "enquête", "risque", "alerte", "signaler"
        ],
        "hindi": [
            "धोखाधड़ी", "संदिग्ध", "स्कैम", "दावा", "विवाद",
            "जांच", "जोखिम", "सतर्कता", "शिकायत"
        ]
    },
    Intent.BUSINESS: {
        "english": [
            "business", "gst", "invoice", "income", "expense", "emi",
            "cashflow", "forecast", "vendor", "profit", "gst", "hsa",
            "category", "small business", "enterprise", "financial"
        ],
        "spanish": [
            "negocio", "factura", "ingresos", "gastos", "flujo",
            "ganancia", "pequeño negocio"
        ],
        "french": [
            "entreprise", "facture", "revenus", "dépenses", "flux",
            "bénéfice", "petite entreprise"
        ],
        "hindi": [
            "व्यापार", "चालान", "आय", "व्यय", "प्रवाह",
            "मुनाफा", "छोटा व्यवसाय"
        ]
    }
}


class IntentDetector:
    """Detects user intent from messages using keyword matching and heuristics"""
    
    def __init__(self):
        self.intent_keywords = INTENT_KEYWORDS
    
    def detect_intent(self, message: str, language: str = "english") -> Tuple[Intent, float]:
        """
        Detect intent from user message
        
        Args:
            message: User message text
            language: Language of the message
            
        Returns:
            Tuple of (Intent, confidence_score)
        """
        message_lower = message.lower()
        intent_scores = {}
        
        # Score each intent based on keyword matches with weighted scoring
        for intent, lang_keywords in self.intent_keywords.items():
            keywords = lang_keywords.get(language, lang_keywords.get("english", []))
            
            score = 0
            matched_keywords = []
            for keyword in keywords:
                # Count keyword occurrences - look for word boundaries or substring
                pattern = r'\b' + re.escape(keyword) + r'\b'
                count = len(re.findall(pattern, message_lower))
                if count > 0:
                    matched_keywords.append((keyword, count))
                    score += count
            
            # Boost score for key phrases (multi-word keywords that are more specific)
            key_phrases = [k for k in keywords if len(k.split()) > 1]
            for phrase in key_phrases:
                pattern = r'\b' + re.escape(phrase) + r'\b'
                count = len(re.findall(pattern, message_lower))
                if count > 0:
                    score += count * 2  # Boost for multi-word phrases
            
            intent_scores[intent] = (score, matched_keywords)
        
        # Sort intents by score
        sorted_intents = sorted(intent_scores.items(), key=lambda x: x[1][0], reverse=True)
        
        # Get top intent
        if sorted_intents[0][1][0] == 0:
            return Intent.GENERAL, 0.0
        
        top_intent = sorted_intents[0][0]
        max_score = sorted_intents[0][1][0]
        
        # Normalize confidence
        confidence = min(0.95, max_score * 0.15)
        confidence = max(0.3, confidence)
        
        return top_intent, confidence
    
    def get_module_for_intent(self, intent: Intent) -> str:
        """Get the module name for the detected intent"""
        intent_to_module = {
            Intent.BUDGET: "budgeting",
            Intent.INVESTMENT: "investment",
            Intent.TRADING: "trading",
            Intent.TAX: "tax",
            Intent.FRAUD: "fraud",
            Intent.BUSINESS: "business",
            Intent.GENERAL: None
        }
        return intent_to_module.get(intent)


class ResponseGenerator:
    """Generates contextual responses based on intent"""
    
    def __init__(self):
        self.intent_responses = {
            Intent.BUDGET: {
                "english": "I can help you with budget management, expense tracking, and spending insights. What would you like to know?",
                "spanish": "Puedo ayudarte con la gestión del presupuesto, seguimiento de gastos e información sobre gastos. ¿Qué te gustaría saber?",
                "french": "Je peux vous aider avec la gestion du budget, le suivi des dépenses et les informations de dépenses. Qu'aimeriez-vous savoir?",
                "hindi": "मैं आपको बजट प्रबंधन, खर्च ट्रैकिंग और खर्च अंतर्दृष्टि के साथ मदद कर सकता हूं। आप क्या जानना चाहते हैं?"
            },
            Intent.INVESTMENT: {
                "english": "I can assist with investment portfolio management, SIP calculations, and risk analysis. How can I help?",
                "spanish": "Puedo ayudarte con la gestión de carteras de inversión, cálculos de SIP y análisis de riesgos. ¿Cómo puedo ayudarte?",
                "french": "Je peux vous aider avec la gestion de portefeuille d'investissement, les calculs de PIA et l'analyse des risques. Comment puis-je vous aider?",
                "hindi": "मैं निवेश पोर्टफोलियो प्रबंधन, SIP गणना और जोखिम विश्लेषण के साथ सहायता कर सकता हूं। मैं कैसे मदद कर सकता हूं?"
            },
            Intent.TRADING: {
                "english": "I can help with technical analysis, trading strategies, and paper trading. What would you like to analyze?",
                "spanish": "Puedo ayudarte con análisis técnico, estrategias de trading y trading de papel. ¿Qué te gustaría analizar?",
                "french": "Je peux vous aider avec l'analyse technique, les stratégies de trading et le trading papier. Qu'aimeriez-vous analyser?",
                "hindi": "मैं तकनीकी विश्लेषण, ट्रेडिंग रणनीति और पेपर ट्रेडिंग के साथ मदद कर सकता हूं। आप क्या विश्लेषण करना चाहते हैं?"
            },
            Intent.TAX: {
                "english": "I can help with tax calculations, deduction tracking, and ITR filing. What tax question do you have?",
                "spanish": "Puedo ayudarte con cálculos fiscales, seguimiento de deducciones y declaración de ITR. ¿Qué pregunta fiscal tienes?",
                "french": "Je peux vous aider avec les calculs fiscaux, le suivi des déductions et la déclaration d'ITR. Quelle question fiscale avez-vous?",
                "hindi": "मैं कर गणना, कटौती ट्रैकिंग और आईटीआर फाइलिंग में मदद कर सकता हूं। आपके पास कर से संबंधित कौन सा प्रश्न है?"
            },
            Intent.FRAUD: {
                "english": "I can assist with fraud investigation, dispute resolution, and chargebacks. Tell me about the issue?",
                "spanish": "Puedo ayudarte con investigación de fraude, resolución de disputas y devoluciones de cargo. ¿Cuéntame sobre el problema?",
                "french": "Je peux vous aider avec l'enquête sur la fraude, la résolution des différends et les contrepassations. Parlez-moi du problème?",
                "hindi": "मैं धोखाधड़ी जांच, विवाद समाधान और चार्जबैक में मदद कर सकता हूं। समस्या के बारे में बताएं?"
            },
            Intent.BUSINESS: {
                "english": "I can help with business finances, GST, invoices, and cash flow forecasting. What business question do you have?",
                "spanish": "Puedo ayudarte con finanzas empresariales, GST, facturas y pronósticos de flujo de caja. ¿Qué pregunta comercial tienes?",
                "french": "Je peux vous aider avec les finances d'entreprise, la TVA, les factures et les prévisions de flux de trésorerie. Quelle question commerciale avez-vous?",
                "hindi": "मैं व्यावसायिक वित्त, जीएसटी, चालान और नकद प्रवाह पूर्वानुमान में मदद कर सकता हूं। आपके पास कौन सा व्यावसायिक प्रश्न है?"
            },
            Intent.GENERAL: {
                "english": "How can I assist you with your financial needs?",
                "spanish": "¿Cómo puedo ayudarte con tus necesidades financieras?",
                "french": "Comment puis-je vous aider avec vos besoins financiers?",
                "hindi": "मैं आपकी वित्तीय आवश्यकताओं में कैसे मदद कर सकता हूं?"
            }
        }
    
    def generate_response(self, intent: Intent, language: str = "english") -> str:
        """Generate a contextual response based on intent"""
        intent_responses = self.intent_responses.get(intent, self.intent_responses[Intent.GENERAL])
        return intent_responses.get(language, intent_responses.get("english"))


def get_intent_detector() -> IntentDetector:
    """Factory function to get intent detector instance"""
    return IntentDetector()


def get_response_generator() -> ResponseGenerator:
    """Factory function to get response generator instance"""
    return ResponseGenerator()
