'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">site-cenca documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AdminComponent.html" data-type="entity-link" >AdminComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminUsersComponent.html" data-type="entity-link" >AdminUsersComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BackToTopComponent.html" data-type="entity-link" >BackToTopComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CardComponent.html" data-type="entity-link" >CardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailDescriptionComponent.html" data-type="entity-link" >DetailDescriptionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailGestionComponent.html" data-type="entity-link" >DetailGestionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailHabitatsComponent.html" data-type="entity-link" >DetailHabitatsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailInfosComponent.html" data-type="entity-link" >DetailInfosComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailMfuComponent.html" data-type="entity-link" >DetailMfuComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailProjetsComponent.html" data-type="entity-link" >DetailProjetsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DocumentationComponent.html" data-type="entity-link" >DocumentationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FooterComponent.html" data-type="entity-link" >FooterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FormButtonsComponent.html" data-type="entity-link" >FormButtonsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HeaderComponent.html" data-type="entity-link" >HeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HomeComponent.html" data-type="entity-link" >HomeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginComponent.html" data-type="entity-link" >LoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MapComponent.html" data-type="entity-link" >MapComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ObjectifComponent.html" data-type="entity-link" >ObjectifComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OperationComponent.html" data-type="entity-link" >OperationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProjetComponent.html" data-type="entity-link" >ProjetComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProjetVComponent.html" data-type="entity-link" >ProjetVComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SiteDetailComponent.html" data-type="entity-link" >SiteDetailComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SitesComponent.html" data-type="entity-link" >SitesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SitesDisplayComponent.html" data-type="entity-link" >SitesDisplayComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SitesResearchComponent.html" data-type="entity-link" >SitesResearchComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/User.html" data-type="entity-link" >User</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AdminServiceService.html" data-type="entity-link" >AdminServiceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ComponentTrackerService.html" data-type="entity-link" >ComponentTrackerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FormService.html" data-type="entity-link" >FormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LoginService.html" data-type="entity-link" >LoginService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MenuService.html" data-type="entity-link" >MenuService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProjetService.html" data-type="entity-link" >ProjetService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SitesService.html" data-type="entity-link" >SitesService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/MenuItemResolver.html" data-type="entity-link" >MenuItemResolver</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Acte.html" data-type="entity-link" >Acte</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Commune.html" data-type="entity-link" >Commune</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Credentials.html" data-type="entity-link" >Credentials</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DetailSite.html" data-type="entity-link" >DetailSite</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DocPlan.html" data-type="entity-link" >DocPlan</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ListSite.html" data-type="entity-link" >ListSite</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Localisation.html" data-type="entity-link" >Localisation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MenuItem.html" data-type="entity-link" >MenuItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MilNat.html" data-type="entity-link" >MilNat</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Objectif.html" data-type="entity-link" >Objectif</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Operation.html" data-type="entity-link" >Operation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OperationLite.html" data-type="entity-link" >OperationLite</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Projet.html" data-type="entity-link" >Projet</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProjetLite.html" data-type="entity-link" >ProjetLite</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProjetV.html" data-type="entity-link" >ProjetV</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Selector.html" data-type="entity-link" >Selector</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectValue.html" data-type="entity-link" >SelectValue</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});