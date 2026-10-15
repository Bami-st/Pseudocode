# Part C4: Recording Preparation Notes (<= 5 Minutes)

> **PRESENTATION CONSTRAINT**:
> - Duration: Maximum 5 minutes.
> - Visuals: Only pseudocode notes displayed on screen; **NO CODE ON SCREEN**.
> - Audience: Nontechnical observer.

---

## 5-Minute Presentation Outline & Script

### 1. Introduction & Real-World Metaphor (0:00 - 1:00)
- **Goal**: Explain what a promotional discount engine does in a store.
- **Talking Points**:
  - *"Imagine you walk into a store with a coupon that says '$10 off when you spend $50 before midnight'. The cashier needs a strict set of rules so they don't give away free money by accident."*
  - *"Today, we are looking at a set of rules—written in plain English, step-by-step pseudocode—that an AI was asked to translate into computer actions."*

### 2. The Core Rules in Pseudocode (1:00 - 2:30)
- **Visual on Screen**: Display the plain English numbered steps from [`part-b/feature_specification.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/feature_specification.md).
- **Talking Points**:
  - Rule 1: Make sure the cart has actual items and no negative numbers.
  - Rule 2: Check the clock: has the expiration time arrived?
  - Rule 3: Check the customer ledger: have they already used this voucher?
  - Rule 4: Add up the total price and verify it meets the minimum spend.
  - Rule 5: Calculate the discount, cap it so it never gives away more money than the order is worth, and return the final total.

### 3. What the AI Did Differently (2:30 - 4:00)
- **Visual on Screen**: Display the difference table highlights from [`part-c/c2_difference_table.md`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c2_difference_table.md).
- **Talking Points**:
  - *"When we audited the AI's behavior, we noticed two interesting things:"*
  - *"First, the AI was 'too helpful'. When someone entered a coupon with extra spaces, the AI secretly trimmed the spaces instead of rejecting it as invalid, which wasn't in our rules."*
  - *"Second, at the exact split-second of expiration, our human rules said 'if time is past deadline, reject', but the AI said 'if time is equal to or past deadline, reject'. A tiny difference in wording led to a real difference in who gets a discount."*

### 4. Conclusion & Key Takeaway (4:00 - 5:00)
- **Talking Points**:
  - *"Computers follow instructions literally, but when instructions leave tiny gaps, AI makes up its own assumptions."*
  - *"Writing clear pseudocode first is how software engineers prevent silent mistakes from affecting customers and finances."*
