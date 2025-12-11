import { useState, useRef, useEffect } from "react";
import QRcode from "./QRcode";
import RedactName from "./RedactName";
import Statistics from "./Statistics";
import "../styles/link-list.scss";
import "../styles/global.scss";

import { pen, x, statistics, copy, qr, share, publics, privates, vk, telegram } from "../images";

export default function LinkList({ links = [], onDelete, user }) {
  const [activeShareMenu, setActiveShareMenu] = useState(null);
  const [activeQR, setActiveQR] = useState(null);
  const [activeRedactName, setActiveRedactName] = useState(null);
  const [activeStatistics, setActiveStatistics] = useState(null);
  const [activeLinkData, setActiveLinkData] = useState(null);
  const [hoveredLinkId, setHoveredLinkId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const shareContainerRefs = useRef({});
  const listClass = user ? "link-list-home" : "link-list-guest";

  const toggleShareMenu = (linkId) => {
    setActiveShareMenu(activeShareMenu === linkId ? null : linkId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeShareMenu !== null) {
        const ref = shareContainerRefs.current[activeShareMenu];
        if (ref && !ref.contains(event.target)) {
          setActiveShareMenu(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeShareMenu]);

  const handleCopy = (linkId, short) => {
    navigator.clipboard.writeText(`http://localhost:5000/r/${short}`);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleQROpen = (link) => {
    setActiveQR(link.qr);
    setActiveLinkData(link);
  };

  const handleQRClose = () => {
    setActiveQR(null);
    setActiveLinkData(null);
  };

  const handleRedactNameOpen = (link) => setActiveRedactName(link);
  const handleRedactNameClose = () => setActiveRedactName(null);

  const handleStatisticsOpen = (link) => setActiveStatistics(link);
  const handleStatisticsClose = () => setActiveStatistics(null);

  const handleMouseEnter = (linkId) => setHoveredLinkId(linkId);
  const handleMouseLeave = () => setHoveredLinkId(null);

  if (!links.length) return null;

  return (
    <>
      <ul id="link-list" className={listClass}>
        {links.map((link, index) => (
          <li
            key={link.id}
            onMouseEnter={() => handleMouseEnter(link.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="block-link">
              <div className="block-left">
                {link.qr && <img className="qr" src={link.qr} alt="qr" onClick={() => handleQROpen(link)} />}

                <div className="block-title">
                  <div className="icons long-url">
                    <a
                      className="weight-400"
                      href={`http://localhost:5000/r/${link.short}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.title || link.short}
                    </a>
                    {user && (
                      <p className="btn btn--top" data-tooltip={link.type ? "Публичная ссылка" : "Личная ссылка"}>
                        <img src={link.type ? publics : privates} alt={link.type ? "publics" : "privates"} />
                      </p>
                    )}
                  </div>

                  <span className="text-little-grey">{link.long}</span>
                  <span className="text-little-grey">
                    {link.created_at ? new Date(link.created_at).toLocaleString("ru-RU", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : ""}
                  </span>

                  <div className={`icons ${hoveredLinkId === link.id ? 'visible' : 'hidden'}`}>
                    <div className="copy-wrapper" style={{ position: "relative" }}>
                      <button className="btn" data-tooltip="Копировать" onClick={() => handleCopy(link.id, link.short)}>
                        <img src={copy} alt="copy" />
                      </button>
                      {copiedLinkId === link.id && <span className="copy-notice">Ссылка скопирована!</span>}
                    </div>

                    {user && (
                      <button className="btn" data-tooltip="Изменить название ссылки" onClick={() => handleRedactNameOpen(link)}>
                        <img src={pen} alt="pen" />
                      </button>
                    )}

                    <button className="btn" data-tooltip="Настройки QR-кода" onClick={() => handleQROpen(link)}>
                      <img src={qr} alt="qr" />
                    </button>

                    <div className="share-container" ref={(el) => (shareContainerRefs.current[link.id] = el)}>
                      <button
                        className={`btn ${activeShareMenu === link.id ? "active" : ""}`}
                        data-tooltip="Поделиться"
                        onClick={() => toggleShareMenu(link.id)}
                      >
                        <img src={share} alt="share" />
                      </button>

                      {activeShareMenu === link.id && (
                        <div className="dropdown-share-menu">
                          <p className="text-average-grey">Поделиться ссылкой</p>
                          <button
                            className="text-average-black weight-400 button-gap"
                            onClick={() => {
                              window.open(`https://t.me/share/url?url=${encodeURIComponent(`http://localhost:5000/r/${link.short}`)}`, '_blank', 'width=600,height=400');
                              setActiveShareMenu(null);
                            }}
                          >
                            <img src={telegram} alt="telegram" />
                            Телеграмм
                          </button>
                          <button
                            className="text-average-black weight-400 button-gap"
                            onClick={() => {
                              window.open(`https://vk.com/share.php?url=${encodeURIComponent(`http://localhost:5000/r/${link.short}`)}`, '_blank', 'width=600,height=400');
                              setActiveShareMenu(null);
                            }}
                          >
                            <img src={vk} alt="vk" />
                            Вконтакте
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {user && (
                <div className={`button-right ${hoveredLinkId === link.id ? 'visible' : 'hidden'}`}>
                  <button className="btn" data-tooltip="Удалить ссылку" onClick={() => onDelete(link.id)}>
                    <img src={x} alt="x" />
                  </button>

                  <button className="btn" data-tooltip="Статистика переходов" onClick={() => handleStatisticsOpen(link)}>
                    <p className="statistics">0<img src={statistics} alt="statistics" /></p>
                  </button>
                </div>
              )}
            </div>

            {index !== links.length - 1 && <hr />}
          </li>
        ))}
      </ul>

      {activeQR && <QRcode qr={activeQR} onClose={handleQRClose} linkData={activeLinkData} />}
      {activeRedactName && <RedactName link={activeRedactName} user={user} onClose={handleRedactNameClose} />}
      {activeStatistics && <Statistics link={activeStatistics} onClose={handleStatisticsClose} />}
    </>
  );
}
