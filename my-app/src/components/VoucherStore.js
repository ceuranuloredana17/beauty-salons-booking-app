
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './VoucherStore.css';


const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RaFuWFLLpJHHcCKgH3ixyGELSDU7BRqhP17oXItji58mUv2LohoJP3YCj5n1DdxcKbXc9G4m7VYHBubkM7uXN9F002YIA4qWo');

const VOUCHER_AMOUNTS = [
    { value: 100, label: '100 RON', popular: false },
    { value: 200, label: '200 RON', popular: true },
    { value: 500, label: '500 RON', popular: false }
];

function VoucherStore() {
    const navigate = useNavigate();
    const [userVouchers, setUserVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);

    useEffect(() => {
        fetchUserVouchers();
    }, []);

    const fetchUserVouchers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:8080/api/vouchers/my-vouchers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const vouchers = await response.json();
                setUserVouchers(vouchers);
            } else {
                throw new Error('Failed to fetch vouchers');
            }
        } catch (err) {
            console.error('Error fetching vouchers:', err);
            setError('Nu s-au putut încărca voucherele');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchaseClick = (amount) => {
        setSelectedAmount(amount);
        setShowPurchaseForm(true);
    };

    const handlePurchaseSuccess = () => {
        setShowPurchaseForm(false);
        setSelectedAmount(null);
        fetchUserVouchers(); 
    };

    if (loading) {
        return (
            <div className="voucher-store loading">
                <div className="loading-spinner"></div>
                <p>Se încarcă voucherele...</p>
            </div>
        );
    }

    return (
        <div className="voucher-store">
            <header className="voucher-header">
                <button className="btn btn-text back-button" onClick={() => navigate(-1)}>
                    ← Înapoi
                </button>
                <h1>Vouchere cadou</h1>
                <p className="voucher-subtitle">Cumpără și gestionează-ți voucherele!</p>
            </header>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Purchase Vouchers Section */}
            <section className="purchase-section">
                <h2>Cumpără vouchere</h2>
                <div className="voucher-options">
                    {VOUCHER_AMOUNTS.map((voucher) => (
                        <div
                            key={voucher.value}
                            className={`voucher-option ${voucher.popular ? 'popular' : ''}`}
                        >
                            {voucher.popular && <span className="popular-badge">Cel mai cumpărat</span>}
                            <div className="voucher-amount">{voucher.label}</div>
                            <div className="voucher-description">
                                Perfect pentru {voucher.value === 100 ? 'o nouă tunsoare' :
                                    voucher.value === 200 ? 'tratamente multiple' :
                                        'servicii premium'}
                            </div>
                            <button
                                className="btn btn-primary buy-voucher-btn"
                                onClick={() => handlePurchaseClick(voucher.value)}
                            >
                                Cumpără acum
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* User's Vouchers Section */}
            <section className="my-vouchers-section">
                <h2>Voucherele mele</h2>
                {userVouchers.length === 0 ? (
                    <div className="no-vouchers">
                        <p>Nu ai încă vouchere</p>
                        <p className="no-vouchers-subtitle">Cumpără primul tău voucher pentru a începe!</p>
                    </div>
                ) : (
                    <div className="vouchers-grid">
                        {userVouchers.map((voucher) => (
                            <VoucherCard key={voucher._id} voucher={voucher} />
                        ))}
                    </div>
                )}
            </section>

            {/* Purchase Form Modal */}
            {showPurchaseForm && (
                <Elements stripe={stripePromise}>
                    <VoucherPurchaseModal
                        amount={selectedAmount}
                        onClose={() => setShowPurchaseForm(false)}
                        onSuccess={handlePurchaseSuccess}
                    />
                </Elements>
            )}
        </div>
    );
}


function VoucherCard({ voucher }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isExpired = new Date(voucher.expiresAt) < new Date();

    return (
        <div className={`voucher-card ${isExpired ? 'expired' : ''}`}>
            <div className="voucher-card-header">
                <span className="voucher-amount">{voucher.amount} RON</span>
                <span className={`voucher-status ${voucher.used ? 'used' : isExpired ? 'expired' : 'active'}`}>
                    {voucher.used ? 'Folosit' : isExpired ? 'Expirat' : 'Activ'}
                </span>
            </div>

            <div className="voucher-card-body">
                <p className="voucher-code">Cod: <strong>{voucher.code}</strong></p>
                <p className="voucher-date">
                    Cumpărat: {formatDate(voucher.createdAt)}
                </p>
                <p className="voucher-expiry">
                    Expiră: {formatDate(voucher.expiresAt)}
                </p>

                {voucher.used && voucher.usedAt && (
                    <p className="voucher-used-date">
                        Folosit: {formatDate(voucher.usedAt)}
                    </p>
                )}
            </div>
        </div>
    );
}


function VoucherPurchaseModal({ amount, onClose, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!stripe || !elements) {
            setError('Stripe nu s-a încărcat încă');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // Create payment intent
            const response = await fetch('http://localhost:8080/api/vouchers/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });

            const { clientSecret } = await response.json();


            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                }
            });

            if (stripeError) {
                setError(stripeError.message);
            } else if (paymentIntent.status === 'succeeded') {

                const voucherResponse = await fetch('http://localhost:8080/api/vouchers/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        amount,
                        paymentIntentId: paymentIntent.id
                    })
                });

                if (voucherResponse.ok) {
                    onSuccess();
                } else {
                    setError('Plata a fost procesată, dar voucherul nu a putut fi creat. Contactați suportul.');
                }
            }
        } catch (err) {
            setError('A apărut o eroare la procesarea plății');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="purchase-modal">
                <div className="modal-header">
                    <h3>Cumpără voucher {amount} RON</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="purchase-form">
                    <div className="payment-summary">
                        <p>Suma: <strong>{amount} RON</strong></p>
                        <p className="test-note">* Aceasta este o plată de test</p>
                    </div>

                    <div className="card-element-container">
                        <label>Detalii card</label>
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#424770',
                                        '::placeholder': {
                                            color: '#aab7c4',
                                        },
                                    },
                                },
                            }}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Anulează
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !stripe}
                        >
                            {loading ? 'Se procesează...' : `Plătește ${amount} RON`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default VoucherStore;


export function PaymentMethodSelector({ onPaymentMethodChange, userVouchers, totalAmount }) {
    const [selectedMethod, setSelectedMethod] = useState('location');
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    const availableVouchers = userVouchers.filter(voucher =>
        !voucher.used &&
        new Date(voucher.expiresAt) > new Date() &&
        voucher.amount >= totalAmount
    );

    const handleMethodChange = (method) => {
        setSelectedMethod(method);
        if (method === 'location') {
            setSelectedVoucher(null);
            onPaymentMethodChange({ method: 'location', voucher: null });
        } else {

            onPaymentMethodChange({ method: 'voucher', voucher: selectedVoucher });
        }
    };

    const handleVoucherSelect = (voucher) => {
        setSelectedVoucher(voucher);
        onPaymentMethodChange({ method: 'voucher', voucher });
    };

    return (
        <div className="payment-method-selector">
            <h3>Metoda de plată</h3>

            <div className="payment-options">
                <label className="payment-option">
                    <input
                        type="radio"
                        name="paymentMethod"
                        value="location"
                        checked={selectedMethod === 'location'}
                        onChange={() => handleMethodChange('location')}
                    />
                    <span className="payment-option-content">
                        <strong>Plată la locație</strong>
                        <p>Plătești direct la salon</p>
                    </span>
                </label>

                <label className="payment-option">
                    <input
                        type="radio"
                        name="paymentMethod"
                        value="voucher"
                        checked={selectedMethod === 'voucher'}
                        onChange={() => handleMethodChange('voucher')}

                    />
                    <span className="payment-option-content">
                        <strong>Folosește voucher</strong>
                        <p>
                            {availableVouchers.length === 0
                                ? 'Introdu codul voucherului manual'
                                : `${availableVouchers.length} voucher${availableVouchers.length > 1 ? 'e' : ''} disponibil${availableVouchers.length > 1 ? 'e' : ''}`
                            }
                        </p>
                    </span>
                </label>
            </div>

            {selectedMethod === 'voucher' && availableVouchers.length > 0 && (
                <div className="voucher-selection">
                    <h4>Selectează voucherul</h4>
                    <div className="available-vouchers">
                        {availableVouchers.map(voucher => (
                            <label key={voucher._id} className="voucher-option">
                                <input
                                    type="radio"
                                    name="selectedVoucher"
                                    value={voucher._id}
                                    checked={selectedVoucher?._id === voucher._id}
                                    onChange={() => handleVoucherSelect(voucher)}
                                />
                                <span className="voucher-option-content">
                                    <strong>{voucher.amount} RON</strong>
                                    <span className="voucher-code">Cod: {voucher.code}</span>
                                    <span className="voucher-change">
                                        {voucher.amount > totalAmount &&
                                            `Rest: ${voucher.amount - totalAmount} RON (se pierde)`
                                        }
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}