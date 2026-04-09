'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  not_helpful_count: number;
  images: string[] | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  has_user_voted?: boolean;
  user_vote?: boolean | null;
}

interface ReviewsProps {
  productId: string;
  productSlug: string;
}

const Reviews: React.FC<ReviewsProps> = ({ productId, productSlug }) => {
  const { user } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratingSummary, setRatingSummary] = useState({
    total: 0,
    average: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    images: [] as string[]
  });

  useEffect(() => {
    if (productId) {
      fetchReviews();
      fetchRatingSummary();
    } else {
      console.warn('Product ID is missing, cannot fetch reviews');
    }
  }, [productId, filterRating, sortBy]);

  const fetchRatingSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        data.forEach(r => {
          breakdown[r.rating as keyof typeof breakdown]++;
        });

        setRatingSummary({ total, average, breakdown });
      }
    } catch (err) {
      console.error('Error fetching rating summary:', err);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId);

      if (filterRating) {
        query = query.eq('rating', filterRating);
      }

      // Sort
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'helpful') {
        query = query.order('helpful_count', { ascending: false });
      } else if (sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user names and votes
      if (data) {
        const reviewsWithUserData = await Promise.all(
          data.map(async (review) => {
            let userName = 'Anonymous';
            let userEmail = '';
            
            // Try to get user profile (if profiles table exists)
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', review.user_id)
                .single();
              
              if (!profileError && profile) {
                userName = profile.full_name || 'Customer';
                userEmail = profile.email || '';
              } else {
                // Fallback: use generic name
                userName = 'Customer';
              }
            } catch (err) {
              // Profiles table might not exist, use fallback
              userName = 'Customer';
            }

            // Check if user has voted (only if logged in)
            let hasVoted = false;
            let userVote = null;
            if (user) {
              try {
                const { data: vote } = await supabase
                  .from('review_helpful')
                  .select('is_helpful')
                  .eq('review_id', review.id)
                  .eq('user_id', user.id)
                  .single();

                hasVoted = !!vote;
                userVote = vote?.is_helpful || null;
              } catch (err) {
                // Vote might not exist, that's okay
              }
            }

            return {
              ...review,
              user_name: userName,
              user_email: userEmail,
              has_user_voted: hasVoted,
              user_vote: userVote
            };
          })
        );
        setReviews(reviewsWithUserData);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('Submit review clicked', { user: !!user, productId, reviewForm });
    
    if (!user) {
      alert('Please login to write a review');
      return;
    }

    if (!productId) {
      alert('Product ID is missing. Please refresh the page.');
      console.error('Product ID is null or undefined:', productId);
      return;
    }

    if (!reviewForm.rating || !reviewForm.comment.trim()) {
      alert('Please provide a rating and comment');
      return;
    }

    setSubmitting(true);

    try {
      // First, check if reviews table exists by trying a simple query
      const { error: tableCheckError } = await supabase
        .from('reviews')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        if (tableCheckError.code === 'PGRST116' || tableCheckError.message?.includes('relation') || tableCheckError.message?.includes('does not exist')) {
          alert('Reviews table not found. Please run the SQL script (supabase_reviews.sql) in your Supabase dashboard to create the reviews table.');
          setSubmitting(false);
          return;
        }
        console.error('Table check error:', tableCheckError);
      }

      // Check if user has already reviewed (use maybeSingle to avoid error if no review exists)
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing review:', checkError);
        throw checkError;
      }

      if (existingReview) {
        alert('You have already reviewed this product');
        setSubmitting(false);
        return;
      }

      // Check if user has purchased (for verified badge) - skip for now to avoid blocking
      // This can be implemented later with a simpler query
      let hasPurchased = false;
      console.log('Skipping purchase check for now - will set verified_purchase to false');

      console.log('Attempting to insert review:', {
        product_id: productId,
        user_id: user.id,
        rating: reviewForm.rating,
        hasPurchased,
        title: reviewForm.title.trim() || null,
        comment: reviewForm.comment.trim()
      });

      // Insert review with timeout protection
      const insertData = {
        product_id: productId,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim() || null,
        comment: reviewForm.comment.trim(),
        is_verified_purchase: hasPurchased,
        images: reviewForm.images.length > 0 ? reviewForm.images : null
      };

      console.log('Inserting review with data:', insertData);

      const { data, error } = await supabase
        .from('reviews')
        .insert(insertData)
        .select();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Supabase insert error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2)
        });
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No data returned from insert');
        throw new Error('Review was not created. Please try again.');
      }

      console.log('Review created successfully:', data);

      // Reset form
      setReviewForm({ rating: 0, title: '', comment: '', images: [] });
      setShowWriteReview(false);
      
      // Refresh reviews and summary
      console.log('Refreshing reviews and summary...');
      await Promise.all([fetchReviews(), fetchRatingSummary()]);
      console.log('Refresh complete');
      
      alert('Review submitted successfully!');
    } catch (err: any) {
      console.error('Error submitting review - Full error:', err);
      console.error('Error type:', typeof err);
      console.error('Error keys:', Object.keys(err || {}));
      
      // More detailed error message
      let errorMessage = 'Failed to submit review.\n\n';
      
      if (err?.code === 'PGRST116' || err?.message?.includes('relation') || err?.message?.includes('does not exist')) {
        errorMessage += 'Reviews table not found.\n\nPlease run the SQL script (supabase_reviews.sql) in your Supabase dashboard to create the reviews table.';
      } else if (err?.code === '42501') {
        errorMessage += 'Permission denied.\n\nPlease check your Row Level Security (RLS) policies in Supabase. Make sure the "Users can create reviews" policy is enabled.';
      } else if (err?.code === '23503') {
        errorMessage += 'Invalid reference.\n\nThe product ID or user ID does not exist.';
      } else if (err?.code === '23505') {
        errorMessage += 'Duplicate entry.\n\nYou have already reviewed this product.';
      } else if (err?.message) {
        errorMessage += `Error: ${err.message}`;
        if (err.details) errorMessage += `\nDetails: ${err.details}`;
        if (err.hint) errorMessage += `\nHint: ${err.hint}`;
      } else {
        errorMessage += 'Unknown error occurred.\n\nPlease check the browser console for more details.';
      }
      
      console.error('Showing error to user:', errorMessage);
      alert(errorMessage);
    } finally {
      console.log('Setting submitting to false');
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    try {
      const { error } = await supabase
        .from('review_helpful')
        .upsert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: isHelpful
        }, {
          onConflict: 'review_id,user_id'
        });

      if (error) throw error;
      fetchReviews();
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const getRatingPercentage = (rating: number) => {
    if (ratingSummary.total === 0) return 0;
    return Math.round((ratingSummary.breakdown[rating as keyof typeof ratingSummary.breakdown] / ratingSummary.total) * 100);
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '0', border: '1px solid rgba(15, 85, 220, 0.1)' }}>
      {/* Rating Summary Section */}
      <div style={{ display: 'flex', gap: '60px', marginBottom: '48px', paddingBottom: '32px', borderBottom: '1px solid rgba(15, 85, 220, 0.1)' }}>
        {/* Left: Overall Rating */}
        <div style={{ minWidth: '200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '56px', fontWeight: '300', color: '#0a0e27', lineHeight: '1', marginBottom: '8px' }}>
              {ratingSummary.average.toFixed(1)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`fa${star <= Math.round(ratingSummary.average) ? 's' : 'r'} fa-star`}
                  style={{ color: '#ffc107', fontSize: '20px' }}
                />
              ))}
            </div>
            <div style={{ fontSize: '13px', color: '#4a5568', letterSpacing: '0.2px' }}>
              {ratingSummary.total} {ratingSummary.total === 1 ? 'Review' : 'Reviews'}
            </div>
          </div>
        </div>

        {/* Right: Rating Breakdown */}
        <div style={{ flex: 1 }}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const percentage = getRatingPercentage(rating);
            const count = ratingSummary.breakdown[rating as keyof typeof ratingSummary.breakdown];
            return (
              <div
                key={rating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                  backgroundColor: filterRating === rating ? 'rgba(15, 85, 220, 0.1)' : 'transparent'
                }}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                onMouseEnter={(e) => {
                  if (filterRating !== rating) e.currentTarget.style.backgroundColor = 'rgba(15, 85, 220, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (filterRating !== rating) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '13px', color: '#0a0e27', minWidth: '60px', fontWeight: '400' }}>
                  {rating} <i className="fas fa-star" style={{ color: '#ffc107', fontSize: '12px' }}></i>
                </span>
                <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(15, 85, 220, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: '#0f55dc',
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: '#4a5568', minWidth: '40px', textAlign: 'right' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters and Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: '400', letterSpacing: '0.3px' }}>Filter:</span>
          <button
            onClick={() => setFilterRating(null)}
            style={{
              padding: '6px 16px',
              border: filterRating === null ? '1px solid #0f55dc' : '1px solid rgba(15, 85, 220, 0.2)',
              background: filterRating === null ? 'rgba(15, 85, 220, 0.1)' : 'transparent',
              color: filterRating === null ? '#0f55dc' : '#4a5568',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '0',
              letterSpacing: '0.2px',
              transition: 'all 0.2s'
            }}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilterRating(filterRating === rating ? null : rating)}
              style={{
                padding: '6px 16px',
                border: filterRating === rating ? '1px solid #0f55dc' : '1px solid rgba(15, 85, 220, 0.2)',
                background: filterRating === rating ? 'rgba(15, 85, 220, 0.1)' : 'transparent',
                color: filterRating === rating ? '#0f55dc' : '#4a5568',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '0',
                letterSpacing: '0.2px',
                transition: 'all 0.2s'
              }}
            >
              {rating} <i className="fas fa-star" style={{ color: '#ffc107', fontSize: '10px' }}></i>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: '400', letterSpacing: '0.3px' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful' | 'rating')}
            style={{
              padding: '6px 12px',
              border: '1px solid rgba(15, 85, 220, 0.2)',
              borderRadius: '0',
              fontSize: '12px',
              color: '#0a0e27',
              cursor: 'pointer',
              letterSpacing: '0.2px',
              background: '#fff'
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </div>

      {/* Write Review Button */}
      {user && !showWriteReview && (
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => setShowWriteReview(true)}
            style={{
              padding: '12px 24px',
              background: '#0f55dc',
              color: '#fff',
              border: 'none',
              borderRadius: '0',
              fontSize: '13px',
              fontWeight: '400',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#0d47b8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#0f55dc'}
          >
            Write a Review
          </button>
        </div>
      )}

      {/* Write Review Form */}
      {showWriteReview && (
        <div style={{ marginBottom: '40px', padding: '32px', border: '1px solid rgba(15, 85, 220, 0.1)', backgroundColor: 'rgba(15, 85, 220, 0.02)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '400', marginBottom: '24px', color: '#0a0e27', letterSpacing: '0.3px' }}>
            Write a Review
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#4a5568', letterSpacing: '0.2px' }}>
              Rating *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0'
                  }}
                >
                  <i
                    className={`fa${star <= reviewForm.rating ? 's' : 'r'} fa-star`}
                    style={{ color: star <= reviewForm.rating ? '#ffc107' : '#e0e0e0', fontSize: '28px' }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#4a5568', letterSpacing: '0.2px' }}>
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder="Give your review a title"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(15, 85, 220, 0.2)',
                borderRadius: '0',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#4a5568', letterSpacing: '0.2px' }}>
              Your Review *
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Share your experience with this product"
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(15, 85, 220, 0.2)',
                borderRadius: '0',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmitReview(e);
              }}
              disabled={submitting}
              style={{
                padding: '12px 32px',
                background: submitting ? '#9ca3af' : '#0f55dc',
                color: '#fff',
                border: 'none',
                borderRadius: '0',
                fontSize: '13px',
                fontWeight: '400',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              onClick={() => {
                setShowWriteReview(false);
                setReviewForm({ rating: 0, title: '', comment: '', images: [] });
              }}
              style={{
                padding: '12px 32px',
                background: 'transparent',
                color: '#4a5568',
                border: '1px solid rgba(15, 85, 220, 0.2)',
                borderRadius: '0',
                fontSize: '13px',
                fontWeight: '400',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#4a5568' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#4a5568', fontSize: '14px', marginBottom: '16px' }}>No reviews yet.</p>
          {!user && (
            <Link href="/auth" style={{ color: '#0f55dc', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.2px' }}>
              Login to write the first review
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: '24px',
                border: '1px solid rgba(15, 85, 220, 0.1)',
                borderRadius: '0',
                backgroundColor: '#fff'
              }}
            >
              {/* Review Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fa${star <= review.rating ? 's' : 'r'} fa-star`}
                          style={{ color: '#ffc107', fontSize: '14px' }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '400', color: '#0a0e27' }}>
                      {review.user_name || 'Anonymous'}
                    </span>
                    {review.is_verified_purchase && (
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: '#0f55dc',
                        color: '#fff',
                        borderRadius: '0',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase'
                      }}>
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 style={{ fontSize: '16px', fontWeight: '400', color: '#0a0e27', marginBottom: '8px', letterSpacing: '0.2px' }}>
                      {review.title}
                    </h4>
                  )}
                  <div style={{ fontSize: '12px', color: '#9ca3af', letterSpacing: '0.2px' }}>
                    {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Review Comment */}
              <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', marginBottom: '16px', letterSpacing: '0.1px' }}>
                {review.comment}
              </p>

              {/* Helpful Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(15, 85, 220, 0.1)' }}>
                <span style={{ fontSize: '12px', color: '#4a5568', letterSpacing: '0.2px' }}>Was this helpful?</span>
                <button
                  onClick={() => handleHelpful(review.id, true)}
                  disabled={review.has_user_voted}
                  style={{
                    padding: '4px 12px',
                    border: '1px solid rgba(15, 85, 220, 0.2)',
                    background: review.user_vote === true ? 'rgba(15, 85, 220, 0.1)' : 'transparent',
                    color: review.user_vote === true ? '#0f55dc' : '#4a5568',
                    fontSize: '12px',
                    cursor: review.has_user_voted ? 'not-allowed' : 'pointer',
                    borderRadius: '0',
                    letterSpacing: '0.2px',
                    opacity: review.has_user_voted ? 0.6 : 1
                  }}
                >
                  Yes ({review.helpful_count})
                </button>
                <button
                  onClick={() => handleHelpful(review.id, false)}
                  disabled={review.has_user_voted}
                  style={{
                    padding: '4px 12px',
                    border: '1px solid rgba(15, 85, 220, 0.2)',
                    background: review.user_vote === false ? 'rgba(15, 85, 220, 0.1)' : 'transparent',
                    color: review.user_vote === false ? '#0f55dc' : '#4a5568',
                    fontSize: '12px',
                    cursor: review.has_user_voted ? 'not-allowed' : 'pointer',
                    borderRadius: '0',
                    letterSpacing: '0.2px',
                    opacity: review.has_user_voted ? 0.6 : 1
                  }}
                >
                  No ({review.not_helpful_count})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
