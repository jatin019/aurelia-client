import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CollectionsPage.css';

const collections = [
  { id:1, title:'The Bridal Edit',      subtitle:'Pieces crafted for your forever moment',              image:'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800&q=80', tag:'NEW SEASON' },
  { id:2, title:'Everyday Luxe',        subtitle:'Effortless elegance for every day',                   image:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80', tag:'BESTSELLER' },
  { id:3, title:'Heritage Collection',  subtitle:'Timeless designs inspired by antique artistry',       image:'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80', tag:'CLASSIC'    },
  { id:4, title:'Gift Guide',           subtitle:'Curated gifting for every occasion',                  image:'https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=800&q=80', tag:'GIFTS'      },
  { id:5, title:'Fine Stones',          subtitle:'Ethically sourced gems of extraordinary beauty',      image:'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&q=80', tag:'EXCLUSIVE'  },
  { id:6, title:'The Minimalist',       subtitle:'Clean lines, quiet luxury',                           image:'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80', tag:'TRENDING'   },
];

export default function CollectionsPage() {
  const navigate = useNavigate();
  return (
    <div className="page-wrapper collections-page">
      <div className="collections-header">
        <h1 className="collections-title">Collections</h1>
        <p className="collections-sub">Thoughtfully curated stories in jewellery</p>
      </div>
      <div className="collections-grid">
        {collections.map(col => (
          <div className="col-card" key={col.id} onClick={() => navigate('/shop')}>
            <div className="col-card-img">
              <img src={col.image} alt={col.title} loading="lazy" />
              <span className="col-tag">{col.tag}</span>
            </div>
            <div className="col-card-info">
              <h3 className="col-card-title">{col.title}</h3>
              <p className="col-card-sub">{col.subtitle}</p>
              <span className="col-card-link">Explore →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}