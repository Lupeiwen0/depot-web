## webhook 事件流程

### 单次支付

**支付成功**

- checkout.session.completed

```json
{
  "id": "evt_1Sj8zBQEUxc7vavP7nTGz1xb",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886093,
  "data": {
    "object": {
      "id": "cs_test_b12frcyPUYP3mQQB8guVkHYVw40rMxonjoOiW42uj6kv1iN9dBBEjYs51p",
      "object": "checkout.session",
      "adaptive_pricing": {
        "enabled": true
      },
      "after_expiration": null,
      "allow_promotion_codes": true,
      "amount_subtotal": 3800,
      "amount_total": 3800,
      "automatic_tax": {
        "enabled": false,
        "liability": null,
        "provider": null,
        "status": null
      },
      "billing_address_collection": "required",
      "cancel_url": "https://stripe.com",
      "client_reference_id": "qGxIM701wBPv40saGgPgylLoVX3IZWzX",
      "client_secret": null,
      "collected_information": {
        "business_name": null,
        "individual_name": null,
        "shipping_details": null
      },
      "consent": null,
      "consent_collection": {
        "payment_method_reuse_agreement": null,
        "promotions": "none",
        "terms_of_service": "none"
      },
      "created": 1766886053,
      "currency": "hkd",
      "currency_conversion": null,
      "custom_fields": [],
      "custom_text": {
        "after_submit": null,
        "shipping_address": null,
        "submit": null,
        "terms_of_service_acceptance": null
      },
      "customer": "cus_TgW1cCgtzSEYJP",
      "customer_account": null,
      "customer_creation": "always",
      "customer_details": {
        "address": {
          "city": "Anchorage",
          "country": "US",
          "line1": "360 L Street",
          "line2": null,
          "postal_code": "99501",
          "state": "AK"
        },
        "business_name": null,
        "email": "supper@lxtt.edu.kg",
        "individual_name": null,
        "name": "xi lu",
        "phone": null,
        "tax_exempt": "none",
        "tax_ids": []
      },
      "customer_email": null,
      "discounts": [],
      "expires_at": 1766972453,
      "invoice": null,
      "invoice_creation": {
        "enabled": false,
        "invoice_data": {
          "account_tax_ids": null,
          "custom_fields": null,
          "description": null,
          "footer": null,
          "issuer": null,
          "metadata": {},
          "rendering_options": null
        }
      },
      "livemode": false,
      "locale": "auto",
      "metadata": {},
      "mode": "payment",
      "origin_context": null,
      "payment_intent": "pi_3Sj8z9QEUxc7vavP0hxAfxkD",
      "payment_link": "plink_1SiwnCQEUxc7vavP8ztCdvQw",
      "payment_method_collection": "if_required",
      "payment_method_configuration_details": null,
      "payment_method_options": {
        "card": {
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": ["card", "link"],
      "payment_status": "paid",
      "permissions": null,
      "phone_number_collection": {
        "enabled": false
      },
      "recovered_from": null,
      "saved_payment_method_options": {
        "allow_redisplay_filters": ["always"],
        "payment_method_remove": "disabled",
        "payment_method_save": null
      },
      "setup_intent": null,
      "shipping_address_collection": null,
      "shipping_cost": null,
      "shipping_options": [],
      "status": "complete",
      "submit_type": "auto",
      "subscription": null,
      "success_url": "https://stripe.com",
      "total_details": {
        "amount_discount": 0,
        "amount_shipping": 0,
        "amount_tax": 0
      },
      "ui_mode": "hosted",
      "url": null,
      "wallet_options": null
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}
```

**退款**

- charge.refunded

```json
{
  "id": "evt_3Sj8z9QEUxc7vavP077F5RoS",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886230,
  "data": {
    "object": {
      "id": "ch_3Sj8z9QEUxc7vavP0e0F37LW",
      "object": "charge",
      "amount": 3800,
      "amount_captured": 3800,
      "amount_refunded": 3800,
      "application": null,
      "application_fee": null,
      "application_fee_amount": null,
      "balance_transaction": "txn_3Sj8z9QEUxc7vavP0WCQBKbX",
      "billing_details": {
        "address": {
          "city": "Anchorage",
          "country": "US",
          "line1": "360 L Street",
          "line2": null,
          "postal_code": "99501",
          "state": "AK"
        },
        "email": "supper@lxtt.edu.kg",
        "name": "xi lu",
        "phone": null,
        "tax_id": null
      },
      "calculated_statement_descriptor": "NEW BUSINESS",
      "captured": true,
      "created": 1766886092,
      "currency": "hkd",
      "customer": "cus_TgW1cCgtzSEYJP",
      "description": null,
      "destination": null,
      "dispute": null,
      "disputed": false,
      "failure_balance_transaction": null,
      "failure_code": null,
      "failure_message": null,
      "fraud_details": {},
      "livemode": false,
      "metadata": {},
      "on_behalf_of": null,
      "order": null,
      "outcome": {
        "advice_code": null,
        "network_advice_code": null,
        "network_decline_code": null,
        "network_status": "approved_by_network",
        "reason": null,
        "risk_level": "normal",
        "risk_score": 11,
        "seller_message": "Payment complete.",
        "type": "authorized"
      },
      "paid": true,
      "payment_intent": "pi_3Sj8z9QEUxc7vavP0hxAfxkD",
      "payment_method": "pm_1Sj8z8QEUxc7vavPPCR0u0QI",
      "payment_method_details": {
        "card": {
          "amount_authorized": 3800,
          "authorization_code": "355054",
          "brand": "visa",
          "checks": {
            "address_line1_check": "pass",
            "address_postal_code_check": "pass",
            "cvc_check": "pass"
          },
          "country": "US",
          "exp_month": 12,
          "exp_year": 2031,
          "extended_authorization": {
            "status": "disabled"
          },
          "fingerprint": "uHQAkz1msEUal3H0",
          "funding": "credit",
          "incremental_authorization": {
            "status": "unavailable"
          },
          "installments": null,
          "last4": "4242",
          "mandate": null,
          "multicapture": {
            "status": "unavailable"
          },
          "network": "visa",
          "network_token": {
            "used": false
          },
          "network_transaction_id": "117728165107122",
          "overcapture": {
            "maximum_amount_capturable": 3800,
            "status": "unavailable"
          },
          "regulated_status": "unregulated",
          "three_d_secure": null,
          "wallet": null
        },
        "type": "card"
      },
      "radar_options": {},
      "receipt_email": null,
      "receipt_number": null,
      "receipt_url": "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xU2lwV1BRRVV4Yzd2YXZQKNaWwsoGMgYtdnWr1qw6LBbd6tRQcnBcbsaYBYT5pFfCjSLJunK-rPJtYuYy9fAZxmiq_yDrDrySMjPq",
      "refunded": true,
      "review": null,
      "shipping": null,
      "source": null,
      "source_transfer": null,
      "statement_descriptor": null,
      "statement_descriptor_suffix": null,
      "status": "succeeded",
      "transfer_data": null,
      "transfer_group": null
    },
    "previous_attributes": {
      "amount_refunded": 0,
      "receipt_url": "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xU2lwV1BRRVV4Yzd2YXZQKNaWwsoGMgZHPuKPgVY6LBYGGw9hCDDb1x-n6fp1NiEP1TtCXrq3uLjxjyRv36IXq07xzEk3zfmMzG7V",
      "refunded": false
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": "req_UgEb2waAVFhnpZ",
    "idempotency_key": "ae0599d9-4a7b-4deb-ad16-f2ad504c1d77"
  },
  "type": "charge.refunded"
}
```

### 订阅支付

> 推送顺序不保证先后

#### 订阅创建

- customer.subscription.created

```json
{
  "id": "evt_1Sj92sQEUxc7vavP9uhaHXpO",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886321,
  "data": {
    "object": {
      "id": "sub_1Sj92qQEUxc7vavPCci7BTks",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1766886318,
      "billing_cycle_anchor_config": null,
      "billing_mode": {
        "flexible": {
          "proration_discounts": "included"
        },
        "type": "flexible"
      },
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1766886318,
      "currency": "hkd",
      "customer": "cus_TgW4BfSMznHNLD",
      "customer_account": null,
      "days_until_due": null,
      "default_payment_method": "pm_1Sj92nQEUxc7vavPdtZ0nifV",
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_TgW5qNd3h4940s",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1766886319,
            "current_period_end": 1769564718,
            "current_period_start": 1766886318,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "plan",
              "active": true,
              "amount": 28800,
              "amount_decimal": "28800",
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "interval": "month",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "recurring": {
                "interval": "month",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "exclusive",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 28800,
              "unit_amount_decimal": "28800"
            },
            "quantity": 1,
            "subscription": "sub_1Sj92qQEUxc7vavPCci7BTks",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1Sj92qQEUxc7vavPCci7BTks"
      },
      "latest_invoice": "in_1Sj92oQEUxc7vavPU6pxBAEo",
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "network": null,
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "payto": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": null,
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
        "object": "plan",
        "active": true,
        "amount": 28800,
        "amount_decimal": "28800",
        "billing_scheme": "per_unit",
        "created": 1766839149,
        "currency": "hkd",
        "interval": "month",
        "interval_count": 1,
        "livemode": false,
        "metadata": {},
        "meter": null,
        "nickname": null,
        "product": "prod_TgJOHgLaqMqGBs",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1766886318,
      "status": "active",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": null,
    "idempotency_key": "962c0d0f-82cb-41f1-81af-13b2ec219c73"
  },
  "type": "customer.subscription.created"
}
```

- invoice.payment_succeeded

```json
{
  "id": "evt_1Sj92sQEUxc7vavP1eItwwkS",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886321,
  "data": {
    "object": {
      "id": "in_1Sj92oQEUxc7vavPU6pxBAEo",
      "object": "invoice",
      "account_country": "HK",
      "account_name": "New business 沙盒",
      "account_tax_ids": null,
      "amount_due": 28800,
      "amount_overpaid": 0,
      "amount_paid": 28800,
      "amount_remaining": 0,
      "amount_shipping": 0,
      "application": null,
      "attempt_count": 0,
      "attempted": true,
      "auto_advance": false,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null,
        "provider": null,
        "status": null
      },
      "automatically_finalizes_at": null,
      "billing_reason": "subscription_create",
      "collection_method": "charge_automatically",
      "created": 1766886318,
      "currency": "hkd",
      "custom_fields": null,
      "customer": "cus_TgW4BfSMznHNLD",
      "customer_account": null,
      "customer_address": {
        "city": "Anchorage",
        "country": "US",
        "line1": "360 L Street",
        "line2": null,
        "postal_code": "99501",
        "state": "AK"
      },
      "customer_email": "supper@lxtt.edu.kg",
      "customer_name": "xi lu",
      "customer_phone": null,
      "customer_shipping": null,
      "customer_tax_exempt": "none",
      "customer_tax_ids": [],
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "due_date": null,
      "effective_at": 1766886318,
      "ending_balance": 0,
      "footer": null,
      "from_invoice": null,
      "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1SipWPQEUxc7vavP/test_YWNjdF8xU2lwV1BRRVV4Yzd2YXZQLF9UZ1c1REpYZHM0QVpqUU5PcWJkTkJRMHFXeDh3MlE2LDE1NzQyNzEyMg020029ciOAyF?s=ap",
      "invoice_pdf": "https://pay.stripe.com/invoice/acct_1SipWPQEUxc7vavP/test_YWNjdF8xU2lwV1BRRVV4Yzd2YXZQLF9UZ1c1REpYZHM0QVpqUU5PcWJkTkJRMHFXeDh3MlE2LDE1NzQyNzEyMg020029ciOAyF/pdf?s=ap",
      "issuer": {
        "type": "self"
      },
      "last_finalization_error": null,
      "latest_revision": null,
      "lines": {
        "object": "list",
        "data": [
          {
            "id": "il_1Sj92oQEUxc7vavPnb2eUVoY",
            "object": "line_item",
            "amount": 28800,
            "currency": "hkd",
            "description": "1 × VIP 月卡 (at $288.00 / month)",
            "discount_amounts": [],
            "discountable": true,
            "discounts": [],
            "invoice": "in_1Sj92oQEUxc7vavPU6pxBAEo",
            "livemode": false,
            "metadata": {},
            "parent": {
              "invoice_item_details": null,
              "subscription_item_details": {
                "invoice_item": null,
                "proration": false,
                "proration_details": {
                  "credited_items": null
                },
                "subscription": "sub_1Sj92qQEUxc7vavPCci7BTks",
                "subscription_item": "si_TgW5qNd3h4940s"
              },
              "type": "subscription_item_details"
            },
            "period": {
              "end": 1769564718,
              "start": 1766886318
            },
            "pretax_credit_amounts": [],
            "pricing": {
              "price_details": {
                "price": "price_1Siwm1QEUxc7vavPVlfsihgO",
                "product": "prod_TgJOHgLaqMqGBs"
              },
              "type": "price_details",
              "unit_amount_decimal": "28800"
            },
            "quantity": 1,
            "subtotal": 28800,
            "taxes": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/invoices/in_1Sj92oQEUxc7vavPU6pxBAEo/lines"
      },
      "livemode": false,
      "metadata": {},
      "next_payment_attempt": null,
      "number": "IZPCSSBT-0001",
      "on_behalf_of": null,
      "parent": {
        "quote_details": null,
        "subscription_details": {
          "metadata": {},
          "subscription": "sub_1Sj92qQEUxc7vavPCci7BTks"
        },
        "type": "subscription_details"
      },
      "payment_settings": {
        "default_mandate": null,
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "payto": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": null
      },
      "period_end": 1766886318,
      "period_start": 1766886318,
      "post_payment_credit_notes_amount": 0,
      "pre_payment_credit_notes_amount": 0,
      "receipt_number": null,
      "rendering": null,
      "shipping_cost": null,
      "shipping_details": null,
      "starting_balance": 0,
      "statement_descriptor": null,
      "status": "paid",
      "status_transitions": {
        "finalized_at": 1766886318,
        "marked_uncollectible_at": null,
        "paid_at": 1766886319,
        "voided_at": null
      },
      "subtotal": 28800,
      "subtotal_excluding_tax": 28800,
      "test_clock": null,
      "total": 28800,
      "total_discount_amounts": [],
      "total_excluding_tax": 28800,
      "total_pretax_credit_amounts": [],
      "total_taxes": [],
      "webhooks_delivered_at": 1766886318
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": null,
    "idempotency_key": "962c0d0f-82cb-41f1-81af-13b2ec219c73"
  },
  "type": "invoice.payment_succeeded"
}
```

- checkout.session.completed

```json
{
  "id": "evt_1Sj92sQEUxc7vavPH9In86kt",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886322,
  "data": {
    "object": {
      "id": "cs_test_b1oifUMF8AEZsb51YggpVAbVHusmIRkwBGYrELZa9ZU259eAq1u5upmin1",
      "object": "checkout.session",
      "adaptive_pricing": {
        "enabled": false
      },
      "after_expiration": null,
      "allow_promotion_codes": true,
      "amount_subtotal": 28800,
      "amount_total": 28800,
      "automatic_tax": {
        "enabled": false,
        "liability": null,
        "provider": null,
        "status": null
      },
      "billing_address_collection": "required",
      "cancel_url": "https://stripe.com",
      "client_reference_id": "qGxIM701wBPv40saGgPgylLoVX3IZWzX",
      "client_secret": null,
      "collected_information": {
        "business_name": null,
        "individual_name": null,
        "shipping_details": null
      },
      "consent": null,
      "consent_collection": {
        "payment_method_reuse_agreement": null,
        "promotions": "none",
        "terms_of_service": "none"
      },
      "created": 1766886286,
      "currency": "hkd",
      "currency_conversion": null,
      "custom_fields": [],
      "custom_text": {
        "after_submit": null,
        "shipping_address": null,
        "submit": null,
        "terms_of_service_acceptance": null
      },
      "customer": "cus_TgW4BfSMznHNLD",
      "customer_account": null,
      "customer_creation": "if_required",
      "customer_details": {
        "address": {
          "city": "Anchorage",
          "country": "US",
          "line1": "360 L Street",
          "line2": null,
          "postal_code": "99501",
          "state": "AK"
        },
        "business_name": null,
        "email": "supper@lxtt.edu.kg",
        "individual_name": null,
        "name": "xi lu",
        "phone": null,
        "tax_exempt": "none",
        "tax_ids": []
      },
      "customer_email": null,
      "discounts": [],
      "expires_at": 1766972685,
      "invoice": "in_1Sj92oQEUxc7vavPU6pxBAEo",
      "invoice_creation": null,
      "livemode": false,
      "locale": "auto",
      "metadata": {},
      "mode": "subscription",
      "origin_context": null,
      "payment_intent": null,
      "payment_link": "plink_1SiwnjQEUxc7vavPBTXhxVIG",
      "payment_method_collection": "always",
      "payment_method_configuration_details": {
        "id": "pmc_1SipWxQEUxc7vavP4Cu0m39F",
        "parent": null
      },
      "payment_method_options": {
        "card": {
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": ["card", "link"],
      "payment_status": "paid",
      "permissions": null,
      "phone_number_collection": {
        "enabled": false
      },
      "recovered_from": null,
      "saved_payment_method_options": {
        "allow_redisplay_filters": ["always"],
        "payment_method_remove": "disabled",
        "payment_method_save": null
      },
      "setup_intent": null,
      "shipping_address_collection": null,
      "shipping_cost": null,
      "shipping_options": [],
      "status": "complete",
      "submit_type": "auto",
      "subscription": "sub_1Sj92qQEUxc7vavPCci7BTks",
      "success_url": "https://stripe.com",
      "total_details": {
        "amount_discount": 0,
        "amount_shipping": 0,
        "amount_tax": 0
      },
      "ui_mode": "hosted",
      "url": null,
      "wallet_options": null
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}
```

#### 退款

**退款&立即取消**

- customer.subscription.deleted

```json
{
  "id": "evt_1Sj95xQEUxc7vavPfrEvxdYL",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886513,
  "data": {
    "object": {
      "id": "sub_1Sj92qQEUxc7vavPCci7BTks",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1766886318,
      "billing_cycle_anchor_config": null,
      "billing_mode": {
        "flexible": {
          "proration_discounts": "included"
        },
        "type": "flexible"
      },
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1766886513,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": "cancellation_requested"
      },
      "collection_method": "charge_automatically",
      "created": 1766886318,
      "currency": "hkd",
      "customer": "cus_TgW4BfSMznHNLD",
      "customer_account": null,
      "days_until_due": null,
      "default_payment_method": "pm_1Sj92nQEUxc7vavPdtZ0nifV",
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "ended_at": 1766886513,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_TgW5qNd3h4940s",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1766886319,
            "current_period_end": 1769564718,
            "current_period_start": 1766886318,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "plan",
              "active": true,
              "amount": 28800,
              "amount_decimal": "28800",
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "interval": "month",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "recurring": {
                "interval": "month",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "exclusive",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 28800,
              "unit_amount_decimal": "28800"
            },
            "quantity": 1,
            "subscription": "sub_1Sj92qQEUxc7vavPCci7BTks",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1Sj92qQEUxc7vavPCci7BTks"
      },
      "latest_invoice": "in_1Sj92oQEUxc7vavPU6pxBAEo",
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "network": null,
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "payto": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": null,
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
        "object": "plan",
        "active": true,
        "amount": 28800,
        "amount_decimal": "28800",
        "billing_scheme": "per_unit",
        "created": 1766839149,
        "currency": "hkd",
        "interval": "month",
        "interval_count": 1,
        "livemode": false,
        "metadata": {},
        "meter": null,
        "nickname": null,
        "product": "prod_TgJOHgLaqMqGBs",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1766886318,
      "status": "canceled",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": "req_daJv1D5qfAz6rC",
    "idempotency_key": null
  },
  "type": "customer.subscription.deleted"
}
```

- charge.refunded

```json
{
  "id": "evt_3Sj92oQEUxc7vavP0fstw2xQ",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886514,
  "data": {
    "object": {
      "id": "ch_3Sj92oQEUxc7vavP0aqWEC3F",
      "object": "charge",
      "amount": 28800,
      "amount_captured": 28800,
      "amount_refunded": 28800,
      "application": null,
      "application_fee": null,
      "application_fee_amount": null,
      "balance_transaction": "txn_3Sj92oQEUxc7vavP0vzbej6N",
      "billing_details": {
        "address": {
          "city": "Anchorage",
          "country": "US",
          "line1": "360 L Street",
          "line2": null,
          "postal_code": "99501",
          "state": "AK"
        },
        "email": "supper@lxtt.edu.kg",
        "name": "xi lu",
        "phone": null,
        "tax_id": null
      },
      "calculated_statement_descriptor": "NEW BUSINESS",
      "captured": true,
      "created": 1766886319,
      "currency": "hkd",
      "customer": "cus_TgW4BfSMznHNLD",
      "description": "Subscription creation",
      "destination": null,
      "dispute": null,
      "disputed": false,
      "failure_balance_transaction": null,
      "failure_code": null,
      "failure_message": null,
      "fraud_details": {},
      "livemode": false,
      "metadata": {},
      "on_behalf_of": null,
      "order": null,
      "outcome": {
        "advice_code": null,
        "network_advice_code": null,
        "network_decline_code": null,
        "network_status": "approved_by_network",
        "reason": null,
        "risk_level": "normal",
        "risk_score": 32,
        "seller_message": "Payment complete.",
        "type": "authorized"
      },
      "paid": true,
      "payment_intent": "pi_3Sj92oQEUxc7vavP0Rpkt1Zn",
      "payment_method": "pm_1Sj92nQEUxc7vavPdtZ0nifV",
      "payment_method_details": {
        "card": {
          "amount_authorized": 28800,
          "authorization_code": "992014",
          "brand": "visa",
          "checks": {
            "address_line1_check": "pass",
            "address_postal_code_check": "pass",
            "cvc_check": "pass"
          },
          "country": "US",
          "exp_month": 12,
          "exp_year": 2031,
          "extended_authorization": {
            "status": "disabled"
          },
          "fingerprint": "uHQAkz1msEUal3H0",
          "funding": "credit",
          "incremental_authorization": {
            "status": "unavailable"
          },
          "installments": null,
          "last4": "4242",
          "mandate": null,
          "multicapture": {
            "status": "unavailable"
          },
          "network": "visa",
          "network_token": {
            "used": false
          },
          "network_transaction_id": "117728165107122",
          "overcapture": {
            "maximum_amount_capturable": 28800,
            "status": "unavailable"
          },
          "regulated_status": "unregulated",
          "three_d_secure": null,
          "wallet": null
        },
        "type": "card"
      },
      "radar_options": {},
      "receipt_email": null,
      "receipt_number": null,
      "receipt_url": "https://pay.stripe.com/receipts/invoices/CAcaFwoVYWNjdF8xU2lwV1BRRVV4Yzd2YXZQKPOYwsoGMgaf6p7claY6LBYdFTz7cFsvoqnteB5bT7uCYDdpt5xNxMVyouekYc494zeiihwSCm0QU2GB?s=ap",
      "refunded": true,
      "review": null,
      "shipping": null,
      "source": null,
      "source_transfer": null,
      "statement_descriptor": null,
      "statement_descriptor_suffix": null,
      "status": "succeeded",
      "transfer_data": null,
      "transfer_group": null
    },
    "previous_attributes": {
      "amount_refunded": 0,
      "receipt_url": "https://pay.stripe.com/receipts/invoices/CAcaFwoVYWNjdF8xU2lwV1BRRVV4Yzd2YXZQKPKYwsoGMgapX7FxjxA6LBYQI5y_LO-KkC5b8oKERh2wwzErTUYfZ10F8jFb0CAMjVKGSm5fXwurfqt1?s=ap",
      "refunded": false
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": "req_NvpXXVT47ouNNq",
    "idempotency_key": "1715d79d-088d-4c89-8f1b-4bdb7d452904"
  },
  "type": "charge.refunded"
}
```

**取消订阅**

> 取消订阅，本期结束后不再续订 cancel_at 为结束日期

- customer.subscription.updated

```json
{
  "id": "evt_1Sj97nQEUxc7vavPsCcp3TGV",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886627,
  "data": {
    "object": {
      "id": "sub_1Sj1gyQEUxc7vavPFGtF7P25",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1766858054,
      "billing_cycle_anchor_config": null,
      "billing_mode": {
        "flexible": {
          "proration_discounts": "included"
        },
        "type": "flexible"
      },
      "billing_thresholds": null,
      "cancel_at": 1769536454,
      "cancel_at_period_end": true,
      "canceled_at": 1766886626,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": "cancellation_requested"
      },
      "collection_method": "charge_automatically",
      "created": 1766858054,
      "currency": "hkd",
      "customer": "cus_TgOTn73INcHzcn",
      "customer_account": null,
      "days_until_due": null,
      "default_payment_method": "pm_1Sj1gvQEUxc7vavPO1FPI8se",
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_TgOTs28bHG5b9Q",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1766858054,
            "current_period_end": 1769536454,
            "current_period_start": 1766858054,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "plan",
              "active": true,
              "amount": 28800,
              "amount_decimal": "28800",
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "interval": "month",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "recurring": {
                "interval": "month",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "exclusive",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 28800,
              "unit_amount_decimal": "28800"
            },
            "quantity": 1,
            "subscription": "sub_1Sj1gyQEUxc7vavPFGtF7P25",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1Sj1gyQEUxc7vavPFGtF7P25"
      },
      "latest_invoice": "in_1Sj1gwQEUxc7vavPC9NbrPze",
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "network": null,
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "payto": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": null,
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
        "object": "plan",
        "active": true,
        "amount": 28800,
        "amount_decimal": "28800",
        "billing_scheme": "per_unit",
        "created": 1766839149,
        "currency": "hkd",
        "interval": "month",
        "interval_count": 1,
        "livemode": false,
        "metadata": {},
        "meter": null,
        "nickname": null,
        "product": "prod_TgJOHgLaqMqGBs",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1766858054,
      "status": "active",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    },
    "previous_attributes": {
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "reason": null
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": "req_L6x0Bklu7fMc72",
    "idempotency_key": "fc9c6f54-b7dc-46db-b852-c515c6c585a5"
  },
  "type": "customer.subscription.updated"
}
```

**订阅续费**

- customer.subscription.updated

```json
{
  "id": "evt_1Sj9DFQEUxc7vavPtvOXPqDW",
  "object": "event",
  "api_version": "2025-12-15.clover",
  "created": 1766886965,
  "data": {
    "object": {
      "id": "sub_1Sj9CeQEUxc7vavPhxMty9O3",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1764553920,
      "billing_cycle_anchor_config": null,
      "billing_mode": {
        "flexible": {
          "proration_discounts": "included"
        },
        "type": "flexible",
        "updated_at": 1764553920
      },
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1764553920,
      "currency": "hkd",
      "customer": "cus_TgWDBC9iOPOb2T",
      "customer_account": null,
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": "card_1Sj9CaQEUxc7vavPrtt9M4mx",
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_TgWFnMcZdwTN9L",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1764553920,
            "current_period_end": 1769910720,
            "current_period_start": 1767232320,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "plan",
              "active": true,
              "amount": 28800,
              "amount_decimal": "28800",
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "interval": "month",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "recurring": {
                "interval": "month",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "exclusive",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 28800,
              "unit_amount_decimal": "28800"
            },
            "quantity": 1,
            "subscription": "sub_1Sj9CeQEUxc7vavPhxMty9O3",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1Sj9CeQEUxc7vavPhxMty9O3"
      },
      "latest_invoice": "in_1Sj9CeQEUxc7vavPSeSOfDgZ",
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": null,
        "payment_method_types": null,
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
        "object": "plan",
        "active": true,
        "amount": 28800,
        "amount_decimal": "28800",
        "billing_scheme": "per_unit",
        "created": 1766839149,
        "currency": "hkd",
        "interval": "month",
        "interval_count": 1,
        "livemode": false,
        "metadata": {},
        "meter": null,
        "nickname": null,
        "product": "prod_TgJOHgLaqMqGBs",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1764553920,
      "status": "active",
      "test_clock": "clock_1Sj9ARQEUxc7vavPfMnrMGiy",
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    },
    "previous_attributes": {
      "items": {
        "data": [
          {
            "id": "si_TgWFnMcZdwTN9L",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1764553920,
            "current_period_end": 1767232320,
            "current_period_start": 1764553920,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "plan",
              "active": true,
              "amount": 28800,
              "amount_decimal": "28800",
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "interval": "month",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1Siwm1QEUxc7vavPVlfsihgO",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1766839149,
              "currency": "hkd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_TgJOHgLaqMqGBs",
              "recurring": {
                "interval": "month",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "exclusive",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 28800,
              "unit_amount_decimal": "28800"
            },
            "quantity": 1,
            "subscription": "sub_1Sj9CeQEUxc7vavPhxMty9O3",
            "tax_rates": []
          }
        ]
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "customer.subscription.updated"
}
```
